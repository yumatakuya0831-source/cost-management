"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const userSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  email: z.email("正しいメールアドレスを入力してください。").trim().toLowerCase().max(254),
  displayName: z.string().trim().min(1, "表示名を入力してください。").max(100, "表示名は100文字以内です。"),
  role: z.enum(["admin", "viewer"]),
  isActive: z.boolean(),
});

export async function saveAppUser(
  _previousState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    role: String(formData.get("role") ?? "viewer"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, email, displayName, role: requestedRole, isActive } = parsed.data;
  const role = id ? requestedRole : "viewer";
  const supabase = await createClient();

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from("app_users")
      .select("id,email,auth_user_id,role,is_active")
      .eq("id", id)
      .single();
    if (readError || !existing) return { status: "error", message: "対象ユーザーを確認できませんでした。" };
    if (existing.auth_user_id && String(existing.email).toLowerCase() !== email) {
      return { status: "error", message: "ログイン済みユーザーのメールアドレスは変更できません。" };
    }
    if (existing.role === "admin" && existing.is_active && (role !== "admin" || !isActive)) {
      const { count, error: countError } = await supabase
        .from("app_users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true);
      if (countError) return { status: "error", message: "管理者数を確認できませんでした。" };
      if ((count ?? 0) <= 1) return { status: "error", message: "最後の有効な管理者は一般化・無効化できません。" };
    }
  }

  const values = { email, display_name: displayName, role, is_active: isActive };
  const { error } = id
    ? await supabase.from("app_users").update(values).eq("id", id)
    : await supabase.from("app_users").insert(values);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "同じGoogleメールアドレスがすでに登録されています。" : "ユーザーを保存できませんでした。",
    };
  }

  revalidatePath("/admin/users");
  return { status: "success", message: id ? "ユーザーを更新しました。" : "許可ユーザーを登録しました。" };
}
