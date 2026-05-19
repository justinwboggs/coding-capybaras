import "server-only";

import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client bound to the request's cookies.
// Use in Server Components, Route Handlers, and Server Actions.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );
}
