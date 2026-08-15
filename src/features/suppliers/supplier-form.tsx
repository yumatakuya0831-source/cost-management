"use client";

import { useActionState } from "react";

import { initialMasterActionState } from "@/features/masters/action-state";
import { saveSupplier } from "@/features/suppliers/actions";

type SupplierInput = { id: string; name: string; contact_note: string | null; is_active: boolean };

export function SupplierForm({ supplier }: { supplier?: SupplierInput }) {
  const [state, formAction, pending] = useActionState(saveSupplier, initialMasterActionState);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
      <input type="hidden" name="id" value={supplier?.id ?? ""} />
      <label className="grid gap-1.5 text-sm font-medium">購入先名<input className="master-input" name="name" defaultValue={supplier?.name} required maxLength={100} />{state.fieldErrors?.name?.[0] && <span className="text-xs text-red-700">{state.fieldErrors.name[0]}</span>}</label>
      <label className="grid gap-1.5 text-sm font-medium">連絡先・メモ（任意）<input className="master-input" name="contactNote" defaultValue={supplier?.contact_note ?? ""} maxLength={500} /></label>
      <label className="flex h-11 items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={supplier?.is_active ?? true} /> 有効</label>
      <div className="flex items-center gap-3 sm:col-span-3"><button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "保存中…" : supplier ? "変更を保存" : "購入先を登録"}</button><p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p></div>
    </form>
  );
}
