-- ─────────────────────────────────────────────────────────────────
-- 0002_pro_tier_rls.sql
--
-- Hand-written, applied AFTER db/migrations/0002_colossal_talkback.sql.
-- Covers what Drizzle won't generate: RLS policies for the two new tables,
-- and idempotent data updates for Tranche 9's pricing-model change.
--
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/manual/0002_pro_tier_rls.sql
-- Or via the Supabase SQL Editor → paste this file.
--
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────

-- 1. Enable RLS on the new tables. Default-deny.
alter table public.platform_support_requests   enable row level security;
alter table public.platform_business_inquiries enable row level security;

-- 2. platform_support_requests
--    - users SELECT/INSERT their own
--    - admins SELECT all + UPDATE status
--    - DELETE: not exposed
drop policy if exists "platform_support_requests_self_read" on public.platform_support_requests;
create policy "platform_support_requests_self_read"
  on public.platform_support_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "platform_support_requests_self_insert" on public.platform_support_requests;
create policy "platform_support_requests_self_insert"
  on public.platform_support_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "platform_support_requests_admin_read" on public.platform_support_requests;
create policy "platform_support_requests_admin_read"
  on public.platform_support_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );

drop policy if exists "platform_support_requests_admin_update" on public.platform_support_requests;
create policy "platform_support_requests_admin_update"
  on public.platform_support_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.platform_users u
      where u.id = auth.uid() and u.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.platform_users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- 3. platform_business_inquiries
--    - anon CAN INSERT (the public Business contact form runs unauthenticated)
--    - only admins CAN SELECT — no client-side leak of leads
--    - UPDATE/DELETE: not exposed
drop policy if exists "platform_business_inquiries_public_insert" on public.platform_business_inquiries;
create policy "platform_business_inquiries_public_insert"
  on public.platform_business_inquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "platform_business_inquiries_admin_read" on public.platform_business_inquiries;
create policy "platform_business_inquiries_admin_read"
  on public.platform_business_inquiries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 4. Pricing-model data updates for Tranche 9.
--
--    - Pro becomes a one-time payment: mode = 'payment', launch price $97.
--      (provider_ids was set manually before Tranche 9 — left untouched here.)
--    - Pro and Business gain the three new feature keys.
--    - Free keeps its existing entitlements ("core" only).
-- ─────────────────────────────────────────────────────────────────

update public.platform_plans
  set mode = 'payment',
      amount_cents = 9700,
      features = '[
        "core",
        "branding_removal",
        "multi_tenancy",
        "advanced_billing",
        "integrations.access",
        "support.priority",
        "updates.notifications"
      ]'::jsonb
  where key = 'pro';

update public.platform_plans
  set features = '[
        "core",
        "branding_removal",
        "multi_tenancy",
        "advanced_billing",
        "sso",
        "audit_log",
        "team_seats",
        "integrations.access",
        "support.priority",
        "updates.notifications"
      ]'::jsonb
  where key = 'business';
