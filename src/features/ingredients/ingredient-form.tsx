"use client";

import { useActionState } from "react";

import { saveIngredient } from "@/features/ingredients/actions";
import { initialMasterActionState } from "@/features/masters/action-state";

export type UnitOption = { id: string; code: string; label: string; dimension: "mass" | "volume" | "count" };
type IngredientInput = { id: string; name: string; base_unit_id: string; loss_rate: number; is_active: boolean };

const dimensionLabels = { mass: "重量", volume: "容量", count: "個数" } as const;

export function IngredientForm({ units, ingredient }: { units: UnitOption[]; ingredient?: IngredientInput }) {
  const [state, formAction, pending] = useActionState(saveIngredient, initialMasterActionState);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <input type="hidden" name="id" value={ingredient?.id ?? ""} />
      <label className="grid gap-1.5 text-sm font-medium">材料名<input className="master-input" name="name" defaultValue={ingredient?.name} required maxLength={100} />{state.fieldErrors?.name?.[0] && <span className="text-xs text-red-700">{state.fieldErrors.name[0]}</span>}</label>
      <label className="grid gap-1.5 text-sm font-medium">基準単位<select className="master-input" name="baseUnitId" defaultValue={ingredient?.base_unit_id ?? ""} required><option value="" disabled>選択してください</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}（{dimensionLabels[unit.dimension]}）</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium">仕込みロス率（%）<input className="master-input" name="lossRate" type="number" min="0" max="99.9" step="0.1" defaultValue={ingredient ? ingredient.loss_rate * 100 : 0} required /></label>
      <label className="flex h-11 items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={ingredient?.is_active ?? true} /> 有効</label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "保存中…" : ingredient ? "変更を保存" : "材料を登録"}</button><p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p></div>
    </form>
  );
}
