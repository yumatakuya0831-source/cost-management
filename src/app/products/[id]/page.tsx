import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type VisibleRecipeItem = { ingredient_id: string; ingredient_name: string; usage_quantity: number; unit_label: string; loss_rate: number; sort_order: number; note: string | null };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product, error: productError }, { data: recipeData, error: recipeError }] = await Promise.all([
    supabase.from("products").select("id,name,sale_price_tax_included,yield_quantity,hide_recipe,target_cost_rate,categories(name)").eq("id", id).eq("is_active", true).maybeSingle(),
    supabase.rpc("get_visible_recipe", { requested_product_id: id }),
  ]);
  if (!product) notFound();
  const row = product as unknown as { id: string; name: string; sale_price_tax_included: number; yield_quantity: number; hide_recipe: boolean; target_cost_rate: number | null; categories: { name: string } | null };
  const recipe = (recipeData ?? []) as VisibleRecipeItem[];
  const recipeIsHidden = user.role !== "admin" && row.hide_recipe;

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">{row.categories?.name ?? "商品"}</p><h1 className="mt-1 text-3xl font-bold">{row.name}</h1></div><div className="flex gap-2"><Link className="master-link" href="/products">商品一覧へ戻る</Link>{user.role === "admin" && <Link className="master-link" href={`/admin/products/${row.id}`}>レシピ編集</Link>}</div></div>
    {(productError || recipeError) && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">商品情報の一部を取得できませんでした。</div>}
    <section className="mt-7 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs text-stone-400">税込販売価格</p><p className="mt-2 text-2xl font-bold">{Math.round(row.sale_price_tax_included).toLocaleString("ja-JP")}円</p></article><article className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs text-stone-400">1仕込み出来上がり</p><p className="mt-2 text-2xl font-bold">{row.yield_quantity.toLocaleString("ja-JP")}個</p></article><article className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs text-stone-400">目標原価率</p><p className="mt-2 text-2xl font-bold">{row.target_cost_rate == null ? "未設定" : `${(row.target_cost_rate * 100).toFixed(1)}%`}</p></article></section>
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">使用材料・レシピ</h2>{recipeIsHidden ? <div className="mt-5 rounded-xl bg-stone-100 p-5"><p className="font-semibold">この商品のレシピは非公開です。</p><p className="mt-1 text-sm text-stone-500">計算済み原価は表示できますが、材料名・使用量・調合情報は取得していません。</p></div> : recipe.length === 0 ? <p className="mt-5 text-sm text-stone-500">レシピ材料はまだ登録されていません。</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-stone-100 text-xs text-stone-400"><tr><th className="pb-3">材料</th><th className="pb-3">使用量</th><th className="pb-3">ロス率</th><th className="pb-3">仕込みメモ</th></tr></thead><tbody>{recipe.map((item) => <tr key={item.ingredient_id} className="border-b border-stone-100 last:border-0"><td className="py-4 font-semibold">{item.ingredient_name}</td><td className="py-4">{item.usage_quantity.toLocaleString("ja-JP")}{item.unit_label}</td><td className="py-4">{(item.loss_rate * 100).toFixed(1)}%</td><td className="py-4 text-stone-500">{item.note || "-"}</td></tr>)}</tbody></table></div>}</section>
  </div></main>;
}
