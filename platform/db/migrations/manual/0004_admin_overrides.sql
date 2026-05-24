-- ─────────────────────────────────────────────────────────────────
-- 0004_admin_overrides.sql
--
-- Adds an admin-controlled manual plan override on platform_users.
-- When non-null, getUserPlan() returns this key instead of deriving
-- entitlement from platform_subscriptions. Used by the admin dashboard
-- (Tranche 17) to grant a tier without involving Stripe — e.g. an
-- internal/staff Pro grant, a customer-support comp, a friends-and-family
-- access pass. Setting back to NULL restores subscription-derived
-- entitlement.
--
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/manual/0004_admin_overrides.sql
-- Or via Supabase SQL editor → paste this file.
--
-- Idempotent: every operation uses IF NOT EXISTS / IF EXISTS so re-runs
-- are no-ops.
-- ─────────────────────────────────────────────────────────────────

-- Add the override column. Nullable; defaults to NULL (no override).
alter table public.platform_users
  add column if not exists manual_plan_override text
    references public.platform_plans (key) on delete set null;

-- No new RLS policy needed:
--   - Reads: covered by existing "platform_users_self_read" (a user
--     reading their own row will see their own override — fine).
--   - Writes: server-only via the service-role connection in the admin
--     server actions (RLS bypassed). No client write path exists.
--
-- No index needed at v1 scale (admin list queries scan the whole
-- platform_users table regardless of override state). Revisit if the
-- user table grows past ~100K rows.
