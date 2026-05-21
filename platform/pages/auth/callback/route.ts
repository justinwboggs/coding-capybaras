import { NextResponse, type NextRequest } from "next/server";

import {
  getOnboardingInitialRedirect,
  getOnboardingMode,
} from "@/platform/lib/config";
import { createCheckoutAction } from "@/platform/pages/account/billing/actions";
import { createSupabaseServerClient } from "@/platform/lib/supabase/server";

// Where a new signup lands when there's no explicit ?next=. In journey mode
// we always go to /dashboard so the requireJourneyComplete() gate fires from
// there — reading initial_redirect here would bypass the gate. In skip mode
// the gate is off, so the callback honors initial_redirect directly.
async function getPostSignupDestination(): Promise<string> {
  const mode = await getOnboardingMode();
  if (mode === "skip") {
    const initialRedirect = await getOnboardingInitialRedirect();
    if (initialRedirect === "docs") return "/docs";
  }
  return "/dashboard";
}

// Both magic-link confirmations and Google OAuth land here with a ?code= param.
// We exchange it for a session cookie and bounce the user to ?next= or the
// mode-aware post-signup destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const destination = await getPostSignupDestination();
  const next = searchParams.get("next") ?? destination;

  // Defend against open-redirects via ?next=. Only allow same-origin paths;
  // a malformed ?next= falls back to the same computed destination.
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : destination;

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

  // Post-signin checkout intent (Tranche 15d): a signed-out user who clicked
  // the Pro CTA arrives here with intent=checkout_pro. Trigger checkout now so
  // they don't have to click the CTA a second time. Scoped to "checkout_pro"
  // by strict equality — any other value falls through to the normal redirect.
  //
  // createCheckoutAction redirects to Stripe on success (throws NEXT_REDIRECT,
  // which must propagate — do NOT wrap this in try/catch) and returns { error }
  // on failure.
  if (searchParams.get("intent") === "checkout_pro") {
    const result = await createCheckoutAction("pro");
    if (result?.error) {
      return NextResponse.redirect(`${origin}/pricing?checkout_error=1`);
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
