import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Static "Finish your setup" page (lives in /public). Served verbatim — it
// does NOT go through the Next.js root layout or touch any Supabase/DB
// client, so it renders even with a blank .env.local.
const SETUP_PATH = "/setup.html";

// Refresh the user's session cookie on every request so server components
// see a fresh auth state. Called from the root middleware.ts.
export async function updateSession(request: NextRequest) {
  // ── Un-configured guard ──────────────────────────────────────────
  // A brand-new clone with an empty .env.local is missing the boot-critical
  // env vars. Two ways that 500s every route:
  //   • the SSR client below throws "supabaseUrl is required" on an empty URL;
  //   • platform/db/client.ts (server-only, pulled in via the root layout)
  //     throws "DATABASE_URL is not set" at module load.
  // So the guard requires ALL of them — both Supabase SSR keys, the
  // service-role key (admin actions / DB writes), and DATABASE_URL (Drizzle).
  // If ANY is missing/empty, short-circuit BEFORE constructing the client and
  // send the visitor to the static setup page instead, so an early `pnpm dev`
  // shows a friendly explainer rather than a stack trace. When every var is
  // present, this block is skipped and behavior is exactly as before.
  const appConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.DATABASE_URL;

  if (!appConfigured) {
    // Don't rewrite the setup page itself (avoids a rewrite loop). Static
    // assets are already excluded by the matcher in the root middleware.ts.
    if (request.nextUrl.pathname === SETUP_PATH) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = SETUP_PATH;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the session — required to refresh expired tokens.
  await supabase.auth.getUser();

  return response;
}
