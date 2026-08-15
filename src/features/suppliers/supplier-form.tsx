"use client";

import { useActionState } from "react";
import { initialMasterActionState } from "@/features/masters/action-state";
import { saveSupplier } from "@/features/suppliers/actions";

type IngredientOption = { id: string; name: string };
export type SupplierInput = { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; postal_code: string | null; address: string | null; order_method: string | null; payment_terms: string | null; lead_time_days: number | null; contact_note: string | null; is_active: boolean; supplier_ingredients: { ingredient_id: string }[] };

export function SupplierForm({ ingredients, supplier }: { ingredients: IngredientOption[]; supplier?: SupplierInput }) {
  const [state, formAction, pending] = useActionState(saveSupplier, initialMasterActionState);
  const selected = new Set(supplier?.supplier_ingredients.map((row) => row.ingredient_id) ?? []);
  const error = (name: string) => state.fieldErrors?.[name]?.[0];
  return <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <input type="hidden" name="id" value={supplier?.id ?? ""} />
    <Field label="購入先名" error={error("name")}><input className="master-input" name="name" defaultValue={supplier?.name} required maxLength={100} /></Field>
    <Field label="担当者名"><input className="master-input" name="contactPerson" defaultValue={supplier?.contact_person ?? ""} maxLength={100} /></Field>
    <Field label="電話番号"><input className="master-input" name="phone" type="tel" defaultValue={supplier?.phone ?? ""} maxLength={30} /></Field>
    <Field label="メールアドレス" error={error("email")}><input className="master-input" name="email" type="email" defaultValue={supplier?.email ?? ""} maxLength={254} /></Field>
    <Field label="郵便番号"><input className="master-input" name="postalCode" defaultValue={supplier?.postal_code ?? ""} maxLength={20} /></Field>
    <Field label="住所"><input className="master-input" name="address" defaultValue={supplier?.address ?? ""} maxLength={300} /></Field>
    <Field label="発注方法"><input className="master-input" name="orderMethod" placeholder="例：Web、電話、メール" defaultValue={supplier?.order_method ?? ""} maxLength={200} /></Field>
    <Field label="支払条件"><input className="master-input" name="paymentTerms" placeholder="例：月末締め翌月末払い" defaultValue={supplier?.payment_terms ?? ""} maxLength={200} /></Field>
    <Field label="標準納期（日）" error={error("leadTimeDays")}><input className="master-input" name="leadTimeDays" type="number" min="0" max="365" step="1" defaultValue={supplier?.lead_time_days ?? ""} /></Field>
    <fieldset className="rounded-xl border border-stone-200 p-4 sm:col-span-2 lg:col-span-3"><legend className="px-1 text-sm font-semibold">取扱材料</legend>{ingredients.length === 0 ? <p className="text-sm text-stone-500">先に材料マスタを登録してください。</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ingredients.map((ingredient) => <label className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm" key={ingredient.id}><input name="ingredientIds" type="checkbox" value={ingredient.id} defaultChecked={selected.has(ingredient.id)} />{ingredient.name}</label>)}</div>}</fieldset>
    <Field label="メモ" wide><textarea className="master-input min-h-24 resize-y" name="contactNote" defaultValue={supplier?.contact_note ?? ""} maxLength={1000} /></Field>
    <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={supplier?.is_active ?? true} /> 有効</label>
    <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3"><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "保存中…" : supplier ? "変更を保存" : "購入先を登録"}</button><p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p></div>
  </form>;
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`grid gap-1.5 text-sm font-medium ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>{label}{children}{error && <span className="text-xs font-normal text-red-700">{error}</span>}</label>;
}
