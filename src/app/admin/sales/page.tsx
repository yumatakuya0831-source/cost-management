import Link from "next/link";
import { redirect } from "next/navigation";

import { MonthlySalesForm, type SalesProduct } from "@/features/sales/monthly-sales-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

function currentMonth() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7); }
function validMonth(value: string | undefined) { return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth(); }

export default async function AdminSalesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");
  const query = await searchParams;
  const targetMonth = validMonth(query.month);
  const targetDate = `${targetMonth}-01`;
  const supabase = await createClient();
  const [productResult, salesResult, snapshotResult] = await Promise.all([
    supabase.from("products").select("id,name,sale_price_tax_included").eq("is_active", true).order("name"),
    supabase.from("monthly_sales").select("product_id,quantity_sold").eq("target_month", targetDate),
    supabase.from("monthly_cost_snapshots").select("product_id,unit_cost,status").eq("target_month", targetDate),
  ]);
  const salesMap = new Map((salesResult.data ?? []).map((row) => [row.product_id, row.quantity_sold]));
  const snapshotMap = new Map((snapshotResult.data ?? []).map((row) => [row.product_id, row]));
  const products: SalesProduct[] = (productResult.data ?? []).map((row) => ({ id: row.id, name: row.name, salePrice: Number(row.sale_price_tax_included), quantitySold: Number(salesMap.get(row.id) ?? 0), unitCost: snapshotMap.get(row.id)?.unit_cost == null ? null : Number(snapshotMap.get(row.id)?.unit_cost), status: (snapshotMap.get(row.id)?.status as "draft" | "confirmed" | undefined) ?? null }));
  const error = productResult.error ?? salesResult.error ?? snapshotResult.error;

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">販売実績・原価再計算</h1><p className="mt-2 text-sm text-stone-500">月単位の商品販売個数を入力し、原価スナップショットを作成します。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品</Link><Link className="master-link" href="/admin/suppliers">仕入価格</Link></nav></div>
    <form className="mt-7 flex flex-wrap items-end gap-3" method="get"><label className="grid gap-1.5 text-sm font-medium">対象月<input className="master-input" name="month" type="month" defaultValue={targetMonth} /></label><button className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold" type="submit">対象月を表示</button></form>
    {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">販売実績を取得できませんでした。</div>}<div className="mt-5"><MonthlySalesForm targetMonth={targetMonth} products={products} /></div>
  </div></main>;
}
