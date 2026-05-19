import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/platform/lib/supabase/server";

// Both magic-link confirmations and Google OAuth land here with a ?code= param.
// We exchange it for a session cookie and bounce the user to ?next= or /dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Defend against open-redirects via ?next=. Only allow same-origin paths.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
