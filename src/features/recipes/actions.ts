"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const recipeItemSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  productId: z.uuid(),
  ingredientId: z.uuid("材料を選択してください。"),
  usageQuantity: z.coerce.number().positive("使用量は0より大きい値です。").max(999_999_999),
  usageUnitId: z.uuid("使用単位を選択してください。"),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  note: z.string().trim().max(1000, "仕込みメモは1000文字以内です。"),
});

export async function saveRecipeItem(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  await requireAdmin();
  const parsed = recipeItemSchema.safeParse({
    id: String(formData.get("id") ?? ""), productId: String(formData.get("productId") ?? ""),
    ingredientId: String(formData.get("ingredientId") ?? ""), usageQuantity: formData.get("usageQuantity"),
    usageUnitId: String(formData.get("usageUnitId") ?? ""), sortOrder: formData.get("sortOrder"), note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const [{ data: ingredient }, { data: unit }] = await Promise.all([
    supabase.from("ingredients").select("units!ingredients_base_unit_id_fkey(dimension)").eq("id", parsed.data.ingredientId).single(),
    supabase.from("units").select("dimension").eq("id", parsed.data.usageUnitId).single(),
  ]);
  const ingredientDimension = (ingredient as unknown as { units: { dimension: string } | null } | null)?.units?.dimension;
  if (!ingredientDimension || !unit || ingredientDimension !== unit.dimension) {
    return { status: "error", message: "材料の基準単位と同じ種類（重量・容量・個数）の使用単位を選択してください。" };
  }

  const values = {
    product_id: parsed.data.productId, ingredient_id: parsed.data.ingredientId, usage_quantity: parsed.data.usageQuantity,
    usage_unit_id: parsed.data.usageUnitId, sort_order: parsed.data.sortOrder, note: parsed.data.note || null, updated_at: new Date().toISOString(),
  };
  const { error } = parsed.data.id
    ? await supabase.from("recipe_items").update(values).eq("id", parsed.data.id)
    : await supabase.from("recipe_items").insert(values);
  if (error) {
    if (error.code === "23505") return { status: "error", message: "この材料はすでにレシピへ登録されています。" };
    if (error.code === "23514") return { status: "error", message: "材料と使用量の単位種類が一致していません。" };
    return { status: "error", message: "レシピを保存できませんでした。" };
  }
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  revalidatePath(`/products/${parsed.data.productId}`);
  return { status: "success", message: parsed.data.id ? "レシピ明細を更新しました。" : "材料をレシピへ追加しました。" };
}

const deleteSchema = z.object({ id: z.uuid(), productId: z.uuid() });

export async function deleteRecipeItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = deleteSchema.safeParse({ id: String(formData.get("id") ?? ""), productId: String(formData.get("productId") ?? "") });
  if (!parsed.success) throw new Error("レシピ明細を特定できませんでした。");
  const supabase = await createClient();
  const { error } = await supabase.from("recipe_items").delete().eq("id", parsed.data.id).eq("product_id", parsed.data.productId);
  if (error) throw new Error("レシピ明細を削除できませんでした。");
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  revalidatePath(`/products/${parsed.data.productId}`);
}
