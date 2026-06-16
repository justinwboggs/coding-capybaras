import "server-only";

import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client bound to the request's cookies.
// Use in Server Components, Route Handlers, and Server Actions.
//
// In the un-configured state (empty .env.local) the root middleware rewrites
// every route to the static /setup.html page, so this never gets called. We
// still guard the env explicitly to surface a clear "finish your setup"
// message instead of Supabase's opaque "supabaseUrl is required" if the
// client is ever reached before the env is set.
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `pnpm dev`. See /setup.html.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll throws when called from a Server Component — safe to ignore
          // because the middleware will refresh the session on the next request.
        }
      },
    },
  });
}
