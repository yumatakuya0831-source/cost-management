"use client";

import { useActionState } from "react";

import { initialMasterActionState } from "@/features/masters/action-state";
import { savePurchasePrice } from "@/features/purchases/actions";
import type { UnitOption } from "@/features/ingredients/ingredient-form";

type Option = { id: string; name: string };
export type PurchasePriceInput = { id: string; ingredient_id: string; supplier_id: string; price_tax_included: number; order_lot_count: number; content_quantity: number; content_unit_id: string; effective_from: string; is_active: boolean };

export function PurchasePriceForm({ ingredients, suppliers, units, price }: { ingredients: Option[]; suppliers: Option[]; units: UnitOption[]; price?: PurchasePriceInput }) {
  const [state, formAction, pending] = useActionState(savePurchasePrice, initialMasterActionState);
  const today = new Date().toISOString().slice(0, 10);
  return <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <input type="hidden" name="id" value={price?.id ?? ""} />
    <SelectField label="材料" name="ingredientId" value={price?.ingredient_id} options={ingredients} />
    <SelectField label="購入先" name="supplierId" value={price?.supplier_id} options={suppliers} />
    <NumberField label="1ロット税込価格（円）" name="priceTaxIncluded" value={price?.price_tax_included} min="0" step="1" />
    <NumberField label="発注数（ロット）" name="orderLotCount" value={price?.order_lot_count ?? 1} min="0.0001" step="0.0001" />
    <NumberField label="1ロット内容量" name="contentQuantity" value={price?.content_quantity} min="0.000001" step="0.000001" />
    <label className="grid gap-1.5 text-sm font-medium">内容量単位<select className="master-input" name="contentUnitId" defaultValue={price?.content_unit_id ?? ""} required><option value="" disabled>選択してください</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium">適用開始日<input className="master-input" name="effectiveFrom" type="date" defaultValue={price?.effective_from ?? today} required /></label>
    <label className="flex h-11 items-center gap-2 self-end text-sm"><input name="isActive" type="checkbox" defaultChecked={price?.is_active ?? true} /> 有効</label>
    <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending || ingredients.length === 0 || suppliers.length === 0} type="submit">{pending ? "保存中…" : price ? "変更を保存" : "仕入価格を登録"}</button><p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p></div>
  </form>;
}

function SelectField({ label, name, value, options }: { label: string; name: string; value?: string; options: Option[] }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<select className="master-input" name={name} defaultValue={value ?? ""} required><option value="" disabled>選択してください</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}
function NumberField({ label, name, value, min, step }: { label: string; name: string; value?: number; min: string; step: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input className="master-input" name={name} type="number" min={min} step={step} defaultValue={value} required /></label>;
}
