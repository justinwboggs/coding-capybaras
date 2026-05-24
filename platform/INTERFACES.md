# `/platform/INTERFACES.md`

This file documents the **public API surface** of the platform region — the functions, types, and conventions that code in `/website/` and `/product/` is allowed to call.

> 📦 **Placeholder — filled in during Tranche 11b-2.**
>
> Tranche 11b-1 creates this region's skeleton. The actual interface inventory
> (auth helpers, billing predicates, the email sender, journey queries, etc.)
> gets documented here once existing code moves into `/platform/` in 11b-2.

If you're working in `/product/` or `/website/` today, the source of truth is still the current code under `/lib/`. After 11b-2, this file becomes the contract — anything not listed here is internal to the platform and shouldn't be imported directly.

## `@/platform/lib/tier`

Tier-based feature gating. Reads the current platform tier from the `PLATFORM_TIER` env var (temporary single-source-of-truth pending the license system in Tranche 18). `server-only`.

```ts
export type Tier = "free" | "pro" | "business";
export const DEFAULT_TIER: Tier; // "free"

/** Current platform tier. Memoized at module level; reads PLATFORM_TIER once. */
export function getTier(): Tier;

/** Predicate for render decisions: is `current` at least `required`? */
export function tierMeets(current: Tier, required: Tier): boolean;

/** Hard gate: throws if the current tier is below `required`. Use in server
 *  actions and route handlers; pages should prefer tierMeets() to lock UI. */
export function requireTier(required: Tier): void;
```

Tier ordering is strict and monotonic: `free` < `pro` < `business`. Higher tiers include everything below them.

## `@/platform/lib/admin/queries`

Server-side reads for the admin dashboard. `server-only`. The Drizzle `db` client used here runs as the service role, so these queries bypass RLS — appropriate since the admin dashboard's purpose is to see every user record. Callers must be in a route that's already gated by `requireAdmin()`.

```ts
export interface AdminUserRow { /* id, email, isAdmin, createdAt, effectiveTier, isOverride, manualPlanOverride */ }
export function listUsers(input?: { q?: string; tier?: PlanKey | "all"; page?: number }): Promise<ListUsersResult>;
export function countUsers(): Promise<number>;
export function countNewUsersSince(since: Date): Promise<number>;
export function countByTier(): Promise<Record<PlanKey, number>>;
export function listAuditEntries(input?: { page?: number; userId?: string; resourceType?: string }): Promise<ListAuditEntriesResult>;
export function listRecentAuditEntriesForUser(userId: string, limit?: number): Promise<PlatformAuditLog[]>;
export const ADMIN_USERS_PAGE_SIZE = 25;
export const ADMIN_AUDIT_PAGE_SIZE = 50;
```

## `@/platform/lib/supabase/admin`

Service-role Supabase client. `server-only`. **Privilege boundary** — bypasses RLS and exposes `auth.admin.*`. Today's only consumer is `deleteUserAction` in `/platform/pages/admin/users/actions.ts`. Add a comment at any new import site noting the reason so the boundary stays auditable.

```ts
export function createSupabaseAdminClient(): SupabaseClient;
```

The Drizzle `db` client also runs as the service role for data operations, so reach for this Supabase client only when you need an auth-side action (deleteUser, generateLink, etc.) that's unique to Supabase's admin SDK.

## Schema additions (Tranche 17)

`platform_users.manual_plan_override` — nullable text, FK to `platform_plans.key` (set null on delete). When non-null, `getUserPlan(userId)` returns this value before consulting `platform_subscriptions`. Migration: `platform/db/migrations/manual/0004_admin_overrides.sql`.
