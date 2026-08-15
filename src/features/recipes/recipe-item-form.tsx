"use client";

import { useActionState } from "react";

import type { UnitOption } from "@/features/ingredients/ingredient-form";
import { initialMasterActionState } from "@/features/masters/action-state";
import { saveRecipeItem } from "@/features/recipes/actions";

export type IngredientOption = { id: string; name: string; base_unit_id: string; units: { dimension: UnitOption["dimension"] } | null };
export type RecipeItemInput = { id: string; ingredient_id: string; usage_quantity: number; usage_unit_id: string; sort_order: number; note: string | null };

export function RecipeItemForm({ productId, ingredients, units, item }: { productId: string; ingredients: IngredientOption[]; units: UnitOption[]; item?: RecipeItemInput }) {
  const [state, formAction, pending] = useActionState(saveRecipeItem, initialMasterActionState);
  return <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <input type="hidden" name="id" value={item?.id ?? ""} /><input type="hidden" name="productId" value={productId} />
    <label className="grid gap-1.5 text-sm font-medium">材料<select className="master-input" name="ingredientId" defaultValue={item?.ingredient_id ?? ""} required><option value="" disabled>選択してください</option>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium">1仕込みの使用量<input className="master-input" name="usageQuantity" type="number" min="0.000001" step="0.000001" defaultValue={item?.usage_quantity} required /></label>
    <label className="grid gap-1.5 text-sm font-medium">使用単位<select className="master-input" name="usageUnitId" defaultValue={item?.usage_unit_id ?? ""} required><option value="" disabled>選択してください</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium">表示順<input className="master-input" name="sortOrder" type="number" min="0" step="1" defaultValue={item?.sort_order ?? 0} required /></label>
    <label className="grid gap-1.5 text-sm font-medium sm:col-span-2 lg:col-span-4">調合・仕込みメモ（任意）<textarea className="master-input min-h-24 resize-y" name="note" defaultValue={item?.note ?? ""} maxLength={1000} /></label>
    <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending || ingredients.length === 0} type="submit">{pending ? "保存中…" : item ? "変更を保存" : "材料を追加"}</button><p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p></div>
  </form>;
}
