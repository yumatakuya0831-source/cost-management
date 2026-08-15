"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const supplierSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1, "購入先名を入力してください。").max(100, "購入先名は100文字以内です。"),
  contactNote: z.string().trim().max(500, "メモは500文字以内です。"),
  isActive: z.boolean(),
});

export async function saveSupplier(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  await requireAdmin();
  const parsed = supplierSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    contactNote: String(formData.get("contactNote") ?? ""),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const values = { name: parsed.data.name, contact_note: parsed.data.contactNote || null, is_active: parsed.data.isActive, updated_at: new Date().toISOString() };
  const { error } = parsed.data.id
    ? await supabase.from("suppliers").update(values).eq("id", parsed.data.id)
    : await supabase.from("suppliers").insert(values);
  if (error) return { status: "error", message: error.code === "23505" ? "同じ購入先名がすでに登録されています。" : "購入先を保存できませんでした。" };

  revalidatePath("/admin/suppliers");
  return { status: "success", message: parsed.data.id ? "購入先を更新しました。" : "購入先を登録しました。" };
}
