"use client";

import { useActionState } from "react";

import { initialMasterActionState } from "@/features/masters/action-state";
import { recalculateMonthlyCosts, saveMonthlySales, type RecalculationActionState } from "@/features/sales/actions";

export type SalesProduct = { id: string; name: string; salePrice: number; quantitySold: number; unitCost: number | null; status: "draft" | "confirmed" | null; costError?: string | null };
const initialRecalculationState: RecalculationActionState = initialMasterActionState;

export function MonthlySalesForm({ targetMonth, products }: { targetMonth: string; products: SalesProduct[] }) {
  const [salesState, salesAction, salesPending] = useActionState(saveMonthlySales, initialMasterActionState);
  const [calcState, calcAction, calcPending] = useActionState(recalculateMonthlyCosts, initialRecalculationState);
  return <div className="space-y-5">
    <form action={salesAction} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><input type="hidden" name="targetMonth" value={targetMonth} /><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">商品別販売個数</h2><p className="mt-1 text-xs text-stone-400">販売個数は0以上の整数で入力します。</p></div><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={salesPending || products.length === 0} type="submit">{salesPending ? "保存中…" : "販売個数を保存"}</button></div>
      {products.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">有効な商品がありません。先に商品マスタを登録してください。</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-stone-100 text-xs text-stone-400"><tr><th className="pb-3">商品</th><th className="pb-3">税込販売価格</th><th className="pb-3">販売個数</th><th className="pb-3">計算済み1個原価</th><th className="pb-3">状態</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b border-stone-100 last:border-0"><td className="py-4 font-semibold"><input type="hidden" name="productId" value={product.id} />{product.name}</td><td className="py-4">{Math.round(product.salePrice).toLocaleString("ja-JP")}円</td><td className="py-4"><input aria-label={`${product.name}の販売個数`} className="master-input max-w-40" name={`quantity:${product.id}`} type="number" min="0" step="1" defaultValue={product.quantitySold} required /></td><td className="py-4">{product.unitCost == null ? "未計算" : `${Math.round(product.unitCost).toLocaleString("ja-JP")}円`}</td><td className="py-4">{product.status === "confirmed" ? "確定" : product.status === "draft" ? "下書き" : "未計算"}</td></tr>)}</tbody></table></div>}
      <p aria-live="polite" className={`mt-4 text-sm ${salesState.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{salesState.message}</p>
    </form>
    <form action={calcAction} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><input type="hidden" name="targetMonth" value={targetMonth} /><h2 className="font-bold">月次原価を再計算</h2><p className="mt-2 text-sm text-stone-500">保存済み販売個数と、対象月末時点の最新仕入価格を使用します。計算値はスナップショットとして保存されます。</p><label className="mt-4 flex items-start gap-2 text-sm"><input className="mt-0.5" name="overwriteConfirmed" type="checkbox" /><span><span className="font-semibold">確定済みデータも上書きする</span><span className="block text-xs text-red-600">通常はチェックしないでください。</span></span></label><button className="mt-5 rounded-xl bg-[#b66d27] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={calcPending || products.length === 0} type="submit">{calcPending ? "計算中…" : "原価を再計算"}</button><p aria-live="polite" className={`mt-4 text-sm ${calcState.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{calcState.message}</p>{calcState.itemErrors?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-red-700">{calcState.itemErrors.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul> : null}</form>
  </div>;
}
