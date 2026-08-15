"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const ingredientSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1, "材料名を入力してください。").max(100, "材料名は100文字以内です。"),
  baseUnitId: z.uuid("基準単位を選択してください。"),
  lossRate: z.coerce.number().min(0, "ロス率は0%以上です。").max(99.9, "ロス率は100%未満です。"),
  isActive: z.boolean(),
});

export async function saveIngredient(
  _previousState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  await requireAdmin();
  const parsed = ingredientSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    baseUnitId: String(formData.get("baseUnitId") ?? ""),
    lossRate: formData.get("lossRate"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const values = {
    name: parsed.data.name,
    base_unit_id: parsed.data.baseUnitId,
    loss_rate: parsed.data.lossRate / 100,
    is_active: parsed.data.isActive,
    updated_at: new Date().toISOString(),
  };
  const { error } = parsed.data.id
    ? await supabase.from("ingredients").update(values).eq("id", parsed.data.id)
    : await supabase.from("ingredients").insert(values);

  if (error) {
    return { status: "error", message: error.code === "23505" ? "同じ材料名がすでに登録されています。" : "材料を保存できませんでした。" };
  }
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin/suppliers");
  return { status: "success", message: parsed.data.id ? "材料を更新しました。" : "材料を登録しました。" };
}
