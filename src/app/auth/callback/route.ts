import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(`${origin}/login?error=code_exchange_failed`);

  const { error: claimError } = await supabase.rpc("claim_app_user");
  if (claimError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=account_not_allowed`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
