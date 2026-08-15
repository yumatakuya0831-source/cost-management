"use client";

import { useActionState } from "react";

import { initialMasterActionState } from "@/features/masters/action-state";
import { saveAppUser } from "@/features/users/actions";

export type AppUserInput = {
  id: string;
  email: string;
  auth_user_id: string | null;
  display_name: string;
  role: "admin" | "viewer";
  is_active: boolean;
};

export function UserForm({ user }: { user?: AppUserInput }) {
  const [state, formAction, pending] = useActionState(saveAppUser, initialMasterActionState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={user?.id ?? ""} />
      <Field label="Googleメールアドレス" error={fieldError("email")}>
        <input className="master-input disabled:bg-stone-100 disabled:text-stone-500" name="email" type="email" defaultValue={user?.email} readOnly={Boolean(user?.auth_user_id)} required maxLength={254} />
      </Field>
      <Field label="表示名" error={fieldError("displayName")}>
        <input className="master-input" name="displayName" defaultValue={user?.display_name} required maxLength={100} />
      </Field>
      <Field label="権限" error={fieldError("role")}>
        <select className="master-input" name="role" defaultValue={user?.role ?? "viewer"}><option value="viewer">一般ユーザー</option><option value="admin">管理者</option></select>
      </Field>
      <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={user?.is_active ?? true} /> 利用を許可する</label></div>
      {user?.auth_user_id && <p className="text-xs text-stone-500 sm:col-span-2">Googleログイン連携済みのため、メールアドレスは変更できません。</p>}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "保存中…" : user ? "変更を保存" : "ユーザーを登録"}</button>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}{error && <span className="text-xs font-normal text-red-700">{error}</span>}</label>;
}
