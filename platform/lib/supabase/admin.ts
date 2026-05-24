import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────
// Service-role Supabase client. Bypasses RLS and exposes the
// auth.admin API surface (listUsers, deleteUser, generateLink, …).
//
// PRIVILEGE BOUNDARY: this key has *full* read/write across every table
// in the Supabase project, regardless of policy. NEVER import this from
// a client component, a route group page, or a generally-callable
// server helper. The single intended consumer is admin server actions
// that need an operation the service role uniquely provides — today
// that's deleteUserAction (auth.admin.deleteUser cascades through
// platform_users → every downstream FK). Add this comment to any new
// consumer at import time so the boundary stays auditable.
//
// The Drizzle `db` client (postgres + DATABASE_URL) also runs as the
// service role and bypasses RLS, so it covers the *data* operations
// — reach for this Supabase client only for auth-side actions.
// ─────────────────────────────────────────────────────────────────

let cached: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "createSupabaseAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      // Server context — no session persistence, no auto-refresh, no
      // URL detection. Each admin action is a fresh call.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
