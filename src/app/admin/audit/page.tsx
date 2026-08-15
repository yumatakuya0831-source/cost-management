import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type AuditRow = {
  id: number;
  actor_user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
};

const tableLabels: Record<string, string> = {
  app_users: "ユーザー",
  categories: "カテゴリ",
  products: "商品",
  ingredients: "材料",
  suppliers: "購入先",
  supplier_ingredients: "購入先・取扱材料",
  purchase_prices: "仕入価格",
  recipe_items: "レシピ明細",
  monthly_sales: "販売実績",
  monthly_cost_snapshots: "月次原価",
};

const actionLabels: Record<string, string> = { insert: "登録", update: "更新", delete: "削除" };
const allowedActions = new Set(["insert", "update", "delete"]);

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ table?: string; action?: string }> }) {
  const currentUser = await getCurrentAppUser();
  if (!currentUser || currentUser.role !== "admin") redirect("/");

  const params = await searchParams;
  const table = params.table && tableLabels[params.table] ? params.table : "";
  const action = params.action && allowedActions.has(params.action) ? params.action : "";
  const supabase = await createClient();
  let auditQuery = supabase
    .from("audit_logs")
    .select("id,actor_user_id,action,table_name,record_id,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (table) auditQuery = auditQuery.eq("table_name", table);
  if (action) auditQuery = auditQuery.eq("action", action);

  const [auditResult, usersResult] = await Promise.all([
    auditQuery,
    supabase.from("app_users").select("auth_user_id,display_name"),
  ]);
  const logs = (auditResult.data ?? []) as AuditRow[];
  const actorNames = new Map(((usersResult.data ?? []) as { auth_user_id: string | null; display_name: string }[]).filter((user) => user.auth_user_id).map((user) => [user.auth_user_id as string, user.display_name]));
  const hasError = Boolean(auditResult.error || usersResult.error);
  const formatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo" });

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">操作履歴</h1><p className="mt-2 text-sm text-stone-500">主要データの登録・更新・削除を新しい順に200件まで確認できます。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品</Link><Link className="master-link" href="/admin/users">ユーザー</Link></nav></div>

    <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" method="get"><label className="grid gap-1.5 text-sm font-medium">対象<select className="master-input" name="table" defaultValue={table}><option value="">すべて</option>{Object.entries(tableLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-1.5 text-sm font-medium">操作<select className="master-input" name="action" defaultValue={action}><option value="">すべて</option><option value="insert">登録</option><option value="update">更新</option><option value="delete">削除</option></select></label><button className="rounded-xl bg-[#183c35] px-5 py-3 text-sm font-semibold text-white" type="submit">絞り込む</button></form></section>

    {hasError && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">操作履歴を取得できませんでした。画面を再読み込みしてください。</div>}
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold">履歴一覧</h2><p className="mt-1 text-xs text-stone-400">{logs.length}件</p></div></div>
      {logs.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">条件に一致する操作履歴はありません。</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-stone-100 text-xs text-stone-400"><tr><th className="pb-3">日時</th><th className="pb-3">操作者</th><th className="pb-3">対象</th><th className="pb-3">操作</th><th className="pb-3">レコードID</th></tr></thead><tbody>{logs.map((log) => <tr className="border-b border-stone-100 last:border-0" key={log.id}><td className="whitespace-nowrap py-4">{formatter.format(new Date(log.created_at))}</td><td className="py-4">{log.actor_user_id ? actorNames.get(log.actor_user_id) ?? "登録済みユーザー" : "システム"}</td><td className="py-4 font-semibold">{tableLabels[log.table_name] ?? log.table_name}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${log.action === "delete" ? "bg-red-50 text-red-700" : log.action === "insert" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{actionLabels[log.action] ?? log.action}</span></td><td className="py-4 font-mono text-xs text-stone-500">{log.record_id ?? "-"}</td></tr>)}</tbody></table></div>}
    </section>
  </div></main>;
}
