import Link from "next/link";
import { redirect } from "next/navigation";

import { UserForm, type AppUserInput } from "@/features/users/user-form";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

type UserRow = AppUserInput & { last_login_at: string | null; created_at: string };

export default async function AdminUsersPage() {
  const currentUser = await getCurrentAppUser();
  if (!currentUser || currentUser.role !== "admin") redirect("/");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id,email,auth_user_id,display_name,role,is_active,last_login_at,created_at")
    .order("created_at");
  const users = (data ?? []) as UserRow[];

  return <main className="min-h-screen bg-[#f6f3ee] px-5 py-8 text-[#28251f] lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#b66d27]">管理者メニュー</p><h1 className="mt-1 text-3xl font-bold">ユーザー管理</h1><p className="mt-2 text-sm text-stone-500">利用を許可するGoogleアカウント、権限、有効状態を管理します。</p></div><nav className="flex flex-wrap gap-2"><Link className="master-link" href="/">ダッシュボード</Link><Link className="master-link" href="/admin/products">商品</Link><Link className="master-link" href="/admin/sales">販売実績</Link></nav></div>
    {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">ユーザーを取得できませんでした。画面を再読み込みしてください。</div>}
    <section className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="font-bold">新しい許可ユーザー</h2><p className="mt-1 text-xs text-stone-500">新規ユーザーは一般ユーザーとして登録されます。登録後、一覧の編集画面から管理者へ変更できます。</p><div className="mt-5"><UserForm /></div></section>
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold">登録済みユーザー</h2><p className="mt-1 text-xs text-stone-400">{users.length}件</p></div></div>
      {users.length === 0 ? <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">ユーザーはまだ登録されていません。</p> : <div className="mt-4 space-y-3">{users.map((user) => <details key={user.id} className="rounded-xl border border-stone-200 p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span><span className="font-semibold">{user.display_name}</span><span className="ml-3 text-sm text-stone-500">{user.email}</span></span><span className="flex items-center gap-2 text-xs font-semibold"><span className={`rounded-full px-2.5 py-1 ${user.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{user.role === "admin" ? "管理者" : "一般"}</span><span className={`rounded-full px-2.5 py-1 ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{user.is_active ? "有効" : "無効"}</span><span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-500">{user.auth_user_id ? "連携済み" : "未ログイン"}</span></span></summary><div className="mt-5 border-t border-stone-100 pt-5"><UserForm user={user} />{user.last_login_at && <p className="mt-4 text-xs text-stone-400">最終ログイン: {new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(user.last_login_at))}</p>}</div></details>)}</div>}
    </section>
  </div></main>;
}
