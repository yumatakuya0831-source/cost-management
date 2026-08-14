import { Coffee } from "lucide-react";

import { signInWithGoogle } from "@/features/auth/actions";

const messages: Record<string, string> = {
  oauth_start_failed: "Googleログインを開始できませんでした。",
  missing_code: "認証コードを確認できませんでした。",
  code_exchange_failed: "Google認証を完了できませんでした。",
  account_not_allowed: "このGoogleアカウントは利用登録されていません。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? messages[params.error] : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f3ee] px-5">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-[0_20px_60px_rgba(60,50,35,0.10)]">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#183c35] text-[#f2ae41]">
          <Coffee size={28} strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold">COST TABLE</h1>
        <p className="mt-2 text-center text-sm text-stone-500">原価管理システムへログイン</p>

        {message && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <form action={signInWithGoogle} className="mt-7">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-800 transition hover:bg-stone-50">
            <span aria-hidden className="text-lg font-bold text-[#4285F4]">G</span>
            Googleでログイン
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-stone-400">
          管理者が登録したGoogleアカウントのみ利用できます。
        </p>
      </section>
    </main>
  );
}
