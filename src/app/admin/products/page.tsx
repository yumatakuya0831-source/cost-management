import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductForm } from "@/features/products/product-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  category_id: string;
  sale_price_tax_included: number;
  yield_quantity: number;
  target_cost_rate: number | null;
  hide_recipe: boolean;
  is_active: boolean;
  categories: { name: string } | null;
};

export default async function AdminProductsPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const [{ data: categoryData, error: categoryError }, { data: productData, error: productError }] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order"),
    supabase.from("products").select("id,name,category_id,sale_price_tax_included,yield_quantity,target_cost_rate,hide_recipe,is_active,categories(name)").order("name"),
  ]);
  const error = categoryError ?? productError;
  const categories = (categoryData ?? []) as { id: string; name: string }[];
  const products = (productData ?? []) as unknown as ProductRow[];

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">商品マスタ</h1><p className="mt-2 text-sm text-stone-500">商品、販売価格、出来上がり数量、レシピ公開設定を管理します。</p></div>
          <nav className="flex gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/suppliers">購入先マスタ</Link></nav>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">データを取得できませんでした。画面を再読み込みしてください。</div>}

        <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">新しい商品</h2><div className="mt-5"><ProductForm categories={categories} /></div>
        </section>

        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">登録済み商品</h2><p className="mt-1 text-xs text-stone-400">{products.length}件</p></div></div>
          {products.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">商品はまだ登録されていません。</p> : (
            <div className="mt-4 space-y-3">{products.map((product) => (
              <details key={product.id} className="rounded-xl border border-stone-200 p-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <span><span className="font-semibold">{product.name}</span><span className="ml-3 text-sm text-stone-500">{product.categories?.name ?? "カテゴリ未設定"}</span></span>
                  <span className="flex items-center gap-3 text-sm"><span>{Math.round(product.sale_price_tax_included).toLocaleString("ja-JP")}円</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{product.is_active ? "有効" : "無効"}</span></span>
                </summary>
                <div className="mt-5 border-t border-stone-100 pt-5"><ProductForm categories={categories} product={product} /></div>
              </details>
            ))}</div>
          )}
        </section>
      </div>
    </main>
  );
}
