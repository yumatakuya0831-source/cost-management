import Link from "next/link";
import { redirect } from "next/navigation";

import { IngredientForm, type UnitOption } from "@/features/ingredients/ingredient-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type IngredientRow = { id: string; name: string; base_unit_id: string; loss_rate: number; is_active: boolean; units: { label: string } | null };

export default async function AdminIngredientsPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");
  const supabase = await createClient();
  const [{ data: unitData, error: unitError }, { data: ingredientData, error: ingredientError }] = await Promise.all([
    supabase.from("units").select("id,code,label,dimension").order("dimension").order("to_base_multiplier"),
    supabase.from("ingredients").select("id,name,base_unit_id,loss_rate,is_active,units(label)").order("name"),
  ]);
  const units = (unitData ?? []) as UnitOption[];
  const ingredients = (ingredientData ?? []) as unknown as IngredientRow[];
  const error = unitError ?? ingredientError;

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">材料マスタ</h1><p className="mt-2 text-sm text-stone-500">材料の基準単位と仕込みロス率を管理します。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品</Link><Link className="master-link" href="/admin/suppliers">購入先・仕入価格</Link></nav></div>
    {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">データを取得できませんでした。画面を再読み込みしてください。</div>}
    <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">新しい材料</h2><div className="mt-5"><IngredientForm units={units} /></div></section>
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">登録済み材料</h2><p className="mt-1 text-xs text-stone-400">{ingredients.length}件</p>{ingredients.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">材料はまだ登録されていません。</p> : <div className="mt-4 space-y-3">{ingredients.map((ingredient) => <details key={ingredient.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span className="font-semibold">{ingredient.name}</span><span className="flex items-center gap-3 text-sm"><span>基準: {ingredient.units?.label ?? "-"}</span><span>ロス率: {(ingredient.loss_rate * 100).toFixed(1)}%</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ingredient.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{ingredient.is_active ? "有効" : "無効"}</span></span></summary><div className="mt-5 border-t border-stone-100 pt-5"><IngredientForm units={units} ingredient={ingredient} /></div></details>)}</div>}</section>
  </div></main>;
}
