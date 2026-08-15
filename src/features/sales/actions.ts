"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { MasterActionState } from "@/features/masters/action-state";
import { requireAdmin } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export type RecalculationActionState = MasterActionState & { itemErrors?: string[] };

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "対象月を選択してください。");
const salesRowSchema = z.object({ productId: z.uuid(), quantitySold: z.coerce.number().int().min(0, "販売個数は0以上です。").max(99_999_999) });

export async function saveMonthlySales(_previousState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  await requireAdmin();
  const monthResult = monthSchema.safeParse(String(formData.get("targetMonth") ?? ""));
  const productIds = formData.getAll("productId").map(String);
  const rowsResult = z.array(salesRowSchema).min(1, "有効な商品がありません。").safeParse(productIds.map((productId) => ({ productId, quantitySold: formData.get(`quantity:${productId}`) })));
  if (!monthResult.success || !rowsResult.success) return { status: "error", message: monthResult.error?.issues[0]?.message ?? rowsResult.error?.issues[0]?.message ?? "入力内容を確認してください。" };

  const targetMonth = `${monthResult.data}-01`;
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_sales").upsert(rowsResult.data.map((row) => ({ product_id: row.productId, target_month: targetMonth, quantity_sold: row.quantitySold, updated_at: new Date().toISOString() })), { onConflict: "product_id,target_month" });
  if (error) return { status: "error", message: "販売個数を保存できませんでした。" };
  revalidatePath("/admin/sales");
  revalidatePath("/");
  return { status: "success", message: `${monthResult.data.replace("-", "年")}月の販売個数を保存しました。` };
}

export async function recalculateMonthlyCosts(_previousState: RecalculationActionState, formData: FormData): Promise<RecalculationActionState> {
  await requireAdmin();
  const monthResult = monthSchema.safeParse(String(formData.get("targetMonth") ?? ""));
  if (!monthResult.success) return { status: "error", message: "対象月を選択してください。" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recalculate_month", { requested_month: `${monthResult.data}-01`, overwrite_confirmed: formData.get("overwriteConfirmed") === "on" });
  if (error) return { status: "error", message: "原価を再計算できませんでした。" };
  const rows = (data ?? []) as { product_id: string; snapshot_id: string | null; unit_cost: number | null; error_message: string | null }[];
  const itemErrors = rows.filter((row) => row.error_message).map((row) => row.error_message as string);
  const successCount = rows.length - itemErrors.length;
  revalidatePath("/admin/sales");
  revalidatePath("/");
  return { status: itemErrors.length ? "error" : "success", message: itemErrors.length ? `${successCount}件成功、${itemErrors.length}件で計算できませんでした。` : `${successCount}商品の原価を再計算しました。`, itemErrors };
}
