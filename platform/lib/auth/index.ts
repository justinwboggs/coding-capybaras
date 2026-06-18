import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { db } from "@/platform/db/client";
import { platformUsers, type PlatformUser } from "@/platform/db/schema/platform";
import { sendEmail } from "@/platform/lib/email";
import { createSupabaseServerClient } from "@/platform/lib/supabase/server";

// Shape returned to callers. Joins the auth user with the platform_users row.
export type CurrentUser = PlatformUser;

/**
 * Returns the current user (auth + platform_users row) or null.
 * Safe to call from any server context.
 *
 * Self-heals: if a Supabase auth user exists but no platform_users row does
 * (trigger race, trigger missing pre-install, or partial state), this inserts
 * one and returns it. The insert uses ON CONFLICT DO NOTHING so concurrent
 * calls are idempotent.
 *
 * Also fires the one-time welcome email on a user's first sign-in — see
 * maybeSendWelcome().
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [existing] = await db
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.id, user.id))
    .limit(1);

  let row: CurrentUser | undefined = existing;

  if (!row) {
    // No platform row yet. The auth.users trigger normally creates it, but a
    // brand-new signup can race the trigger and pre-trigger users may also be
    // missing. Insert idempotently and re-select.
    if (!user.email) return null; // can't create a row without an email

    // is_admin is intentionally omitted — first-user promotion lives at the
    // DB layer in the platform_users BEFORE INSERT trigger (migration 0005),
    // so this self-heal path and the auth.users trigger stay consistent.
    await db
      .insert(platformUsers)
      .values({ id: user.id, email: user.email })
      .onConflictDoNothing({ target: platformUsers.id });

    const [healed] = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, user.id))
      .limit(1);
    row = healed;
  }

  if (!row) return null;

  // First-ever sign-in → fire the welcome email exactly once. Cheap for
  // returning users: the metadata flag is checked in-memory, no extra query.
  await maybeSendWelcome(row);

  return row;
}

/**
 * Sends the welcome email the first time we see a user — regardless of whether
 * their platform_users row came from the auth.users trigger or the self-heal
 * insert above (hooking only the self-heal would miss the common case, since
 * the trigger usually wins the race).
 *
 * Idempotency lives in platform_users.metadata.welcomed, claimed with an
 * atomic UPDATE so concurrent first-requests can't double-send. The send
 * itself is deferred with after(): it never blocks the request and survives
 * serverless teardown, unlike a bare floating promise.
 */
async function maybeSendWelcome(row: CurrentUser): Promise<void> {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  if (metadata.welcomed === true) return;

  const claimed = await db
    .update(platformUsers)
    .set({
      metadata: sql`${platformUsers.metadata} || '{"welcomed": true}'::jsonb`,
    })
    .where(
      and(
        eq(platformUsers.id, row.id),
        sql`${platformUsers.metadata} ->> 'welcomed' IS DISTINCT FROM 'true'`,
      ),
    )
    .returning({ id: platformUsers.id });

  if (claimed.length === 0) return; // another request already claimed it

  after(async () => {
    await sendEmail({
      to: row.email,
      templateKey: "welcome",
      data: { user: { email: row.email } },
    });
  });
}

/**
 * True when `err` (or anything in its `cause` chain) is Postgres
 * undefined_table (42P01) — i.e. the Supabase project is connected but its
 * tables haven't been migrated yet. postgres-js wraps the driver error, so we
 * check the `code`, fall back to a message match, and recurse into `cause`.
 *
 * Mirrors the env-guard pattern: instead of crashing into the error boundary
 * on a fresh, un-migrated DB, requireAuth uses this to redirect to the static
 * /database-setup.html guide.
 */
function isSchemaNotReady(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown; cause?: unknown };
  if (e.code === "42P01") return true;
  if (typeof e.message === "string" && /relation .* does not exist/i.test(e.message)) {
    return true;
  }
  // Walk the cause chain (guard against a self-referential cause).
  if (e.cause && e.cause !== err) return isSchemaNotReady(e.cause);
  return false;
}

/**
 * Like getCurrentUser, but redirects to /sign-in if not authenticated.
 * Use in authed layouts, server actions, and route handlers.
 *
 * Pass `{ next }` to preserve the originally-requested path through the
 * sign-in round-trip — the user lands back on that path after auth. Same
 * `?next=` convention used by /sign-in itself and the /auth/callback
 * handler (see platform/pages/auth/callback/route.ts). Added in Tranche
 * 11c-1b so the gated /api/download/boilerplate route can bounce
 * anonymous visitors back to /docs/download after sign-in.
 *
 * Existing callers (no args) keep their previous behavior: redirect to
 * bare /sign-in, no preservation.
 */
export async function requireAuth(opts?: { next?: string }): Promise<CurrentUser> {
  let user: CurrentUser | null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    // Connected to Supabase but the tables don't exist yet (fresh project,
    // migrations not applied) → undefined_table on the first platform_users
    // query. Send the user to the static DB-setup guide rather than the error
    // boundary. That page renders without the DB, and the env is configured by
    // this point so the middleware env-guard passes through — no redirect loop.
    if (isSchemaNotReady(err)) {
      redirect("/database-setup.html" as Route);
    }
    throw err;
  }
  if (!user) {
    // Only encode same-origin paths; an absolute/protocol-relative `next`
    // would be filtered out by /auth/callback anyway, but reject here too
    // so we never emit a redirect URL that looks open-redirect-shaped.
    const safe =
      opts?.next && opts.next.startsWith("/") && !opts.next.startsWith("//") ? opts.next : null;
    const dest = safe ? `/sign-in?next=${encodeURIComponent(safe)}` : "/sign-in";
    // `dest` is a dynamic same-origin path — typedRoutes can't statically
    // verify the query string, so cast to satisfy the redirect signature.
    redirect(dest as Route);
  }
  return user;
}

/**
 * Like requireAuth, but additionally requires platform_users.is_admin = true.
 * Non-admins are redirected to /dashboard rather than /sign-in to avoid
 * leaking the existence of admin routes.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

/**
 * Pure predicate over a user row. Useful when you already have the user.
 */
export function isAdmin(user: CurrentUser | null): boolean {
  return Boolean(user?.isAdmin);
}

/**
 * Sign the current user out and redirect to the marketing home.
 * Designed to be called from a server action.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
