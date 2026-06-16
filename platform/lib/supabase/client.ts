"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client. Use only in client components.
//
// In the un-configured state (empty .env.local) the root middleware rewrites
// every route to the static /setup.html page, so this never gets called.
// We still guard the env explicitly to surface a clear "finish your setup"
// message instead of Supabase's opaque "supabaseUrl is required" if the
// client is ever reached before the env is set.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `pnpm dev`. See /setup.html.",
    );
  }
  return createBrowserClient(url, anonKey);
}
