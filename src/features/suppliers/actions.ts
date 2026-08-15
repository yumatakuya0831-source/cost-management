"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const supplierSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1, "購入先名を入力してください。").max(100, "購入先名は100文字以内です。"),
  contactPerson: z.string().trim().max(100), phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("正しいメールアドレスを入力してください。").max(254)]),
  postalCode: z.string().trim().max(20), address: z.string().trim().max(300),
  orderMethod: z.string().trim().max(200), paymentTerms: z.string().trim().max(200),
  leadTimeDays: z.union([z.literal(""), z.coerce.number().int().min(0, "標準納期は0日以上です。").max(365)]),
  contactNote: z.string().trim().max(1000, "メモは1000文字以内です。"),
  ingredientIds: z.array(z.uuid()).max(500),
  isActive: z.boolean(),
});

export async function saveSupplier(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  await requireAdmin();
  const parsed = supplierSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    contactPerson: String(formData.get("contactPerson") ?? ""), phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""), postalCode: String(formData.get("postalCode") ?? ""),
    address: String(formData.get("address") ?? ""), orderMethod: String(formData.get("orderMethod") ?? ""),
    paymentTerms: String(formData.get("paymentTerms") ?? ""), leadTimeDays: String(formData.get("leadTimeDays") ?? ""),
    contactNote: String(formData.get("contactNote") ?? ""),
    ingredientIds: formData.getAll("ingredientIds").map(String),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const values = { name: parsed.data.name, contact_person: parsed.data.contactPerson || null, phone: parsed.data.phone || null, email: parsed.data.email || null, postal_code: parsed.data.postalCode || null, address: parsed.data.address || null, order_method: parsed.data.orderMethod || null, payment_terms: parsed.data.paymentTerms || null, lead_time_days: parsed.data.leadTimeDays === "" ? null : parsed.data.leadTimeDays, contact_note: parsed.data.contactNote || null, is_active: parsed.data.isActive, updated_at: new Date().toISOString() };
  const result = parsed.data.id
    ? await supabase.from("suppliers").update(values).eq("id", parsed.data.id).select("id").single()
    : await supabase.from("suppliers").insert(values).select("id").single();
  const { error } = result;
  if (error) return { status: "error", message: error.code === "23505" ? "同じ購入先名がすでに登録されています。" : "購入先を保存できませんでした。" };

  const supplierId = result.data.id as string;
  const { error: deleteError } = await supabase.from("supplier_ingredients").delete().eq("supplier_id", supplierId);
  if (deleteError) return { status: "error", message: "購入先は保存しましたが、取扱材料を更新できませんでした。" };
  if (parsed.data.ingredientIds.length > 0) {
    const { error: linkError } = await supabase.from("supplier_ingredients").insert(parsed.data.ingredientIds.map((ingredientId) => ({ supplier_id: supplierId, ingredient_id: ingredientId })));
    if (linkError) return { status: "error", message: "購入先は保存しましたが、取扱材料を更新できませんでした。" };
  }

  revalidatePath("/admin/suppliers");
  return { status: "success", message: parsed.data.id ? "購入先を更新しました。" : "購入先を登録しました。" };
}
