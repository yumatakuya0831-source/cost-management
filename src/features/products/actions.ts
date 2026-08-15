"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1, "商品名を入力してください。").max(100, "商品名は100文字以内です。"),
  categoryId: z.uuid("カテゴリを選択してください。"),
  salePrice: z.coerce.number().min(0, "販売価格は0円以上です。").max(99_999_999, "販売価格が大きすぎます。"),
  yieldQuantity: z.coerce.number().positive("出来上がり数量は0より大きい値です。").max(100_000, "出来上がり数量が大きすぎます。"),
  targetCostRate: z.union([z.literal(""), z.coerce.number().min(0).max(99.9)]),
  hideRecipe: z.boolean(),
  isActive: z.boolean(),
});

export async function saveProduct(
  _previousState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    salePrice: formData.get("salePrice"),
    yieldQuantity: formData.get("yieldQuantity"),
    targetCostRate: String(formData.get("targetCostRate") ?? ""),
    hideRecipe: formData.get("hideRecipe") === "on",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, name, categoryId, salePrice, yieldQuantity, targetCostRate, hideRecipe, isActive } = parsed.data;
  const supabase = await createClient();
  const values = {
    name,
    category_id: categoryId,
    sale_price_tax_included: salePrice,
    yield_quantity: yieldQuantity,
    target_cost_rate: targetCostRate === "" ? null : targetCostRate / 100,
    hide_recipe: hideRecipe,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("products").update(values).eq("id", id)
    : await supabase.from("products").insert(values);

  if (error) {
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate ? "同じ商品名がすでに登録されています。" : "商品を保存できませんでした。時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { status: "success", message: id ? "商品を更新しました。" : "商品を登録しました。" };
}
