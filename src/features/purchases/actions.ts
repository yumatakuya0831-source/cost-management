"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const purchasePriceSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  ingredientId: z.uuid("材料を選択してください。"),
  supplierId: z.uuid("購入先を選択してください。"),
  priceTaxIncluded: z.coerce.number().min(0, "税込価格は0円以上です。").max(999_999_999),
  orderLotCount: z.coerce.number().positive("発注ロット数は0より大きい値です。").max(100_000),
  contentQuantity: z.coerce.number().positive("内容量は0より大きい値です。").max(999_999_999),
  contentUnitId: z.uuid("内容量単位を選択してください。"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "適用開始日を入力してください。"),
  isActive: z.boolean(),
});

export async function savePurchasePrice(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  await requireAdmin();
  const parsed = purchasePriceSchema.safeParse({
    id: String(formData.get("id") ?? ""), ingredientId: String(formData.get("ingredientId") ?? ""), supplierId: String(formData.get("supplierId") ?? ""),
    priceTaxIncluded: formData.get("priceTaxIncluded"), orderLotCount: formData.get("orderLotCount"), contentQuantity: formData.get("contentQuantity"),
    contentUnitId: String(formData.get("contentUnitId") ?? ""), effectiveFrom: String(formData.get("effectiveFrom") ?? ""), isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const [{ data: ingredient }, { data: unit }] = await Promise.all([
    supabase.from("ingredients").select("units!ingredients_base_unit_id_fkey(dimension)").eq("id", parsed.data.ingredientId).single(),
    supabase.from("units").select("dimension").eq("id", parsed.data.contentUnitId).single(),
  ]);
  const ingredientDimension = (ingredient as unknown as { units: { dimension: string } | null } | null)?.units?.dimension;
  if (!ingredientDimension || !unit || ingredientDimension !== unit.dimension) {
    return { status: "error", message: "材料の基準単位と同じ種類（重量・容量・個数）の内容量単位を選択してください。" };
  }

  const values = {
    ingredient_id: parsed.data.ingredientId, supplier_id: parsed.data.supplierId, price_tax_included: parsed.data.priceTaxIncluded,
    order_lot_count: parsed.data.orderLotCount, content_quantity: parsed.data.contentQuantity, content_unit_id: parsed.data.contentUnitId,
    effective_from: parsed.data.effectiveFrom, is_active: parsed.data.isActive, updated_at: new Date().toISOString(),
  };
  const { error } = parsed.data.id
    ? await supabase.from("purchase_prices").update(values).eq("id", parsed.data.id)
    : await supabase.from("purchase_prices").insert(values);
  if (error) {
    if (error.code === "23505") return { status: "error", message: "同じ材料・購入先・適用開始日の価格がすでに登録されています。" };
    if (error.code === "23514") return { status: "error", message: "材料と内容量の単位種類が一致していません。" };
    return { status: "error", message: "仕入価格を保存できませんでした。" };
  }
  const { error: linkError } = await supabase.from("supplier_ingredients").upsert(
    { supplier_id: parsed.data.supplierId, ingredient_id: parsed.data.ingredientId },
    { onConflict: "supplier_id,ingredient_id", ignoreDuplicates: true },
  );
  if (linkError) return { status: "error", message: "仕入価格は保存しましたが、購入先と材料を紐付けできませんでした。" };
  revalidatePath("/admin/suppliers");
  return { status: "success", message: parsed.data.id ? "仕入価格を更新しました。" : "仕入価格を登録しました。" };
}
