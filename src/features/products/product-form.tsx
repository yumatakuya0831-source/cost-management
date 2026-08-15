"use client";

import { useActionState } from "react";

import { initialMasterActionState } from "@/features/masters/action-state";
import { saveProduct } from "@/features/products/actions";

type Category = { id: string; name: string };
type ProductInput = {
  id: string;
  name: string;
  category_id: string;
  sale_price_tax_included: number;
  yield_quantity: number;
  target_cost_rate: number | null;
  hide_recipe: boolean;
  is_active: boolean;
};

export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductInput }) {
  const [state, formAction, pending] = useActionState(saveProduct, initialMasterActionState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <Field label="商品名" error={fieldError("name")}>
        <input className="master-input" name="name" defaultValue={product?.name} required maxLength={100} />
      </Field>
      <Field label="カテゴリ" error={fieldError("categoryId")}>
        <select className="master-input" name="categoryId" defaultValue={product?.category_id ?? ""} required>
          <option value="" disabled>選択してください</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </Field>
      <Field label="税込販売価格（円）" error={fieldError("salePrice")}>
        <input className="master-input" name="salePrice" type="number" min="0" step="1" defaultValue={product?.sale_price_tax_included} required />
      </Field>
      <Field label="1仕込みの出来上がり数量" error={fieldError("yieldQuantity")}>
        <input className="master-input" name="yieldQuantity" type="number" min="0.0001" step="0.0001" defaultValue={product?.yield_quantity ?? 20} required />
      </Field>
      <Field label="目標原価率（%・任意）" error={fieldError("targetCostRate")}>
        <input className="master-input" name="targetCostRate" type="number" min="0" max="99.9" step="0.1" defaultValue={product?.target_cost_rate == null ? "" : product.target_cost_rate * 100} />
      </Field>
      <div className="flex flex-wrap items-end gap-5 pb-1">
        <label className="flex items-center gap-2 text-sm"><input name="hideRecipe" type="checkbox" defaultChecked={product?.hide_recipe ?? false} /> レシピを一般ユーザーに非表示</label>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={product?.is_active ?? true} /> 有効</label>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="rounded-xl bg-[#183c35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
          {pending ? "保存中…" : product ? "変更を保存" : "商品を登録"}
        </button>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</p>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}{error && <span className="text-xs font-normal text-red-700">{error}</span>}</label>;
}
