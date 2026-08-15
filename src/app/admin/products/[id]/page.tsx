import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { UnitOption } from "@/features/ingredients/ingredient-form";
import { deleteRecipeItem } from "@/features/recipes/actions";
import { RecipeItemForm, type IngredientOption, type RecipeItemInput } from "@/features/recipes/recipe-item-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");
  const { id } = await params;
  const supabase = await createClient();
  const [productResult, ingredientResult, unitResult, recipeResult] = await Promise.all([
    supabase.from("products").select("id,name,yield_quantity,hide_recipe").eq("id", id).maybeSingle(),
    supabase.from("ingredients").select("id,name,base_unit_id,units!ingredients_base_unit_id_fkey(dimension)").eq("is_active", true).order("name"),
    supabase.from("units").select("id,code,label,dimension").order("dimension").order("to_base_multiplier"),
    supabase.from("recipe_items").select("id,ingredient_id,usage_quantity,usage_unit_id,sort_order,note,ingredients(name),units(label)").eq("product_id", id).order("sort_order"),
  ]);
  if (!productResult.data) notFound();
  const product = productResult.data as { id: string; name: string; yield_quantity: number; hide_recipe: boolean };
  const ingredients = (ingredientResult.data ?? []) as unknown as IngredientOption[];
  const units = (unitResult.data ?? []) as UnitOption[];
  const items = (recipeResult.data ?? []) as unknown as (RecipeItemInput & { ingredients: { name: string } | null; units: { label: string } | null })[];
  const error = productResult.error ?? ingredientResult.error ?? unitResult.error ?? recipeResult.error;

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">商品レシピ</p><h1 className="mt-1 text-3xl font-bold">{product.name}</h1><p className="mt-2 text-sm text-stone-500">1仕込み（出来上がり {product.yield_quantity.toLocaleString("ja-JP")}個）に使用する材料を管理します。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/admin/products">商品マスタへ戻る</Link><Link className="master-link" href={`/products/${product.id}`}>閲覧画面</Link></nav></div>
    <div className={`mt-6 rounded-xl p-4 text-sm ${product.hide_recipe ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{product.hide_recipe ? "秘密レシピ：一般ユーザーには材料名・使用量・メモを返しません。" : "公開レシピ：許可済み一般ユーザーもレシピを閲覧できます。"}</div>
    {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">データを取得できませんでした。</div>}
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">材料を追加</h2>{ingredients.length === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">先に材料マスタを登録してください。</p>}<div className="mt-5"><RecipeItemForm productId={product.id} ingredients={ingredients} units={units} /></div></section>
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">レシピ明細</h2><p className="mt-1 text-xs text-stone-400">{items.length}件</p>{items.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">レシピ材料はまだ登録されていません。</p> : <div className="mt-4 space-y-3">{items.map((item) => <details key={item.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span className="font-semibold">{item.ingredients?.name ?? "-"}</span><span className="text-sm">{item.usage_quantity.toLocaleString("ja-JP")}{item.units?.label ?? ""}</span></summary><div className="mt-5 border-t border-stone-100 pt-5"><RecipeItemForm productId={product.id} ingredients={ingredients} units={units} item={item} /><form action={deleteRecipeItem} className="mt-4 border-t border-stone-100 pt-4"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="productId" value={product.id} /><button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700" type="submit">この材料を削除</button></form></div></details>)}</div>}</section>
  </div></main>;
}
