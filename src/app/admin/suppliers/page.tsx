import Link from "next/link";
import { redirect } from "next/navigation";

import type { UnitOption } from "@/features/ingredients/ingredient-form";
import { PurchasePriceForm, type PurchasePriceInput } from "@/features/purchases/purchase-price-form";
import { SupplierForm, type SupplierInput } from "@/features/suppliers/supplier-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type SupplierRow = SupplierInput;
type PurchasePriceRow = PurchasePriceInput & {
  ingredients: { name: string } | null;
  suppliers: { name: string } | null;
  units: { label: string } | null;
};

export default async function AdminSuppliersPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");
  const supabase = await createClient();
  const [supplierResult, ingredientResult, unitResult, priceResult] = await Promise.all([
    supabase.from("suppliers").select("id,name,contact_person,phone,email,postal_code,address,order_method,payment_terms,lead_time_days,contact_note,is_active,supplier_ingredients(ingredient_id)").order("name"),
    supabase.from("ingredients").select("id,name").eq("is_active", true).order("name"),
    supabase.from("units").select("id,code,label,dimension").order("dimension").order("to_base_multiplier"),
    supabase.from("purchase_prices").select("id,ingredient_id,supplier_id,price_tax_included,order_lot_count,content_quantity,content_unit_id,effective_from,is_active,ingredients(name),suppliers(name),units(label)").order("effective_from", { ascending: false }),
  ]);
  const suppliers = (supplierResult.data ?? []) as SupplierRow[];
  const ingredients = (ingredientResult.data ?? []) as { id: string; name: string }[];
  const units = (unitResult.data ?? []) as UnitOption[];
  const prices = (priceResult.data ?? []) as unknown as PurchasePriceRow[];
  const error = supplierResult.error ?? ingredientResult.error ?? unitResult.error ?? priceResult.error;

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">購入先・仕入価格</h1><p className="mt-2 text-sm text-stone-500">購入先と、材料ごとの税込仕入価格・発注ロットを管理します。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品</Link><Link className="master-link" href="/admin/ingredients">材料</Link></nav></div>
      {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">データを取得できませんでした。画面を再読み込みしてください。</div>}
      <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">新しい購入先</h2><div className="mt-5"><SupplierForm ingredients={ingredients} /></div></section>
      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">登録済み購入先</h2><p className="mt-1 text-xs text-stone-400">{suppliers.length}件</p>
        {suppliers.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">購入先はまだ登録されていません。</p> : <div className="mt-4 space-y-3">{suppliers.map((supplier) => <details key={supplier.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span><span className="font-semibold">{supplier.name}</span>{supplier.contact_person && <span className="ml-3 text-sm text-stone-500">担当: {supplier.contact_person}</span>}</span><span className="flex items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">取扱材料 {supplier.supplier_ingredients.length}件</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{supplier.is_active ? "有効" : "無効"}</span></span></summary><div className="mt-5 border-t border-stone-100 pt-5"><SupplierForm ingredients={ingredients} supplier={supplier} /></div></details>)}</div>}
      </section>
      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">新しい仕入価格</h2><p className="mt-1 text-xs text-stone-400">価格は税込、内容量は1ロットあたりで入力します。</p>
        {ingredients.length === 0 || suppliers.length === 0 ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">仕入価格の登録前に、材料と購入先を1件以上登録してください。</p> : null}
        <div className="mt-5"><PurchasePriceForm ingredients={ingredients} suppliers={suppliers} units={units} /></div>
      </section>
      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">仕入価格履歴</h2><p className="mt-1 text-xs text-stone-400">{prices.length}件・適用開始日の新しい順</p>
        {prices.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">仕入価格はまだ登録されていません。</p> : <div className="mt-4 space-y-3">{prices.map((price) => <details key={price.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span><span className="font-semibold">{price.ingredients?.name ?? "-"}</span><span className="ml-3 text-sm text-stone-500">{price.suppliers?.name ?? "-"}</span></span><span className="flex flex-wrap items-center gap-3 text-sm"><span>{Math.round(price.price_tax_included).toLocaleString("ja-JP")}円 / {price.content_quantity.toLocaleString("ja-JP")}{price.units?.label ?? ""}</span><span>{price.order_lot_count.toLocaleString("ja-JP")}ロット発注</span><span>{price.effective_from}〜</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${price.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{price.is_active ? "有効" : "無効"}</span></span></summary><div className="mt-5 border-t border-stone-100 pt-5"><PurchasePriceForm ingredients={ingredients} suppliers={suppliers} units={units} price={price} /></div></details>)}</div>}
      </section>
    </div></main>
  );
}
