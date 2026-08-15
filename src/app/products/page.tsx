import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type ProductRow = { id: string; name: string; sale_price_tax_included: number; yield_quantity: number; hide_recipe: boolean; categories: { name: string } | null };

export default async function ProductsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id,name,sale_price_tax_included,yield_quantity,hide_recipe,categories(name)").eq("is_active", true).order("name");
  const products = (data ?? []) as unknown as ProductRow[];

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">商品情報</p><h1 className="mt-1 text-3xl font-bold">商品一覧</h1><p className="mt-2 text-sm text-stone-500">税込販売価格とレシピ公開状態を確認できます。</p></div><Link className="master-link" href="/">ダッシュボードへ戻る</Link></div>
    {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">商品を取得できませんでした。</div>}
    {products.length === 0 ? <p className="mt-7 rounded-2xl bg-white p-6 text-sm text-stone-500">有効な商品はまだ登録されていません。</p> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-stone-400">{product.categories?.name ?? "未分類"}</p><h2 className="mt-1 text-lg font-bold">{product.name}</h2></div>{product.hide_recipe && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">レシピ非公開</span>}</div><p className="mt-5 text-2xl font-bold">{Math.round(product.sale_price_tax_included).toLocaleString("ja-JP")}円</p><p className="mt-2 text-xs text-stone-400">1仕込み {product.yield_quantity.toLocaleString("ja-JP")}個</p></Link>)}</div>}
  </div></main>;
}
