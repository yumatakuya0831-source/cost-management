import Link from "next/link";
import { redirect } from "next/navigation";

import { SupplierForm } from "@/features/suppliers/supplier-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type SupplierRow = { id: string; name: string; contact_note: string | null; is_active: boolean };

export default async function AdminSuppliersPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/");
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").select("id,name,contact_note,is_active").order("name");
  const suppliers = (data ?? []) as SupplierRow[];

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">購入先マスタ</h1><p className="mt-2 text-sm text-stone-500">仕入れに利用する購入先を管理します。</p></div><nav className="flex gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品マスタ</Link></nav></div>
      {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">データを取得できませんでした。画面を再読み込みしてください。</div>}
      <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">新しい購入先</h2><div className="mt-5"><SupplierForm /></div></section>
      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">登録済み購入先</h2><p className="mt-1 text-xs text-stone-400">{suppliers.length}件</p>
        {suppliers.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">購入先はまだ登録されていません。</p> : <div className="mt-4 space-y-3">{suppliers.map((supplier) => <details key={supplier.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span className="font-semibold">{supplier.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{supplier.is_active ? "有効" : "無効"}</span></summary><div className="mt-5 border-t border-stone-100 pt-5"><SupplierForm supplier={supplier} /></div></details>)}</div>}
      </section>
    </div></main>
  );
}
