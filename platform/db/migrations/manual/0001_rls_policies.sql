-- ─────────────────────────────────────────────────────────────────
-- 0001_rls_policies.sql
--
-- Hand-written, applied AFTER drizzle-kit's 0000_init.sql.
-- Drizzle does not generate RLS, triggers, or auth-schema bridges —
-- those live here so they are reviewable and version-controlled.
--
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/0001_rls_policies.sql
-- Or via Supabase SQL editor → paste this file.
--
-- Service role key bypasses RLS automatically. All app writes go through
-- the server using the service role; client-side Supabase reads use the
-- anon key + a logged-in JWT, gated by the policies below.
-- ─────────────────────────────────────────────────────────────────

-- 1. Enable RLS on every platform_ table. Default-deny.
alter table public.platform_users               enable row level security;
alter table public.platform_payment_customers   enable row level security;
alter table public.platform_plans               enable row level security;
alter table public.platform_subscriptions       enable row level security;
alter table public.platform_usage_events        enable row level security;
alter table public.platform_email_log           enable row level security;
alter table public.platform_audit_log           enable row level security;
alter table public.platform_config              enable row level security;

-- 2. platform_users — a user can read their own row only.
--    No INSERT/UPDATE/DELETE from clients; the trigger and server actions own writes.
drop policy if exists "platform_users_self_read" on public.platform_users;
create policy "platform_users_self_read"
  on public.platform_users
  for select
  to authenticated
  using (id = auth.uid());

-- 3. platform_payment_customers — read your own.
drop policy if exists "platform_payment_customers_self_read" on public.platform_payment_customers;
create policy "platform_payment_customers_self_read"
  on public.platform_payment_customers
  for select
  to authenticated
  using (user_id = auth.uid());

-- 4. platform_plans — public catalog. Anyone (incl. anon) can read.
drop policy if exists "platform_plans_public_read" on public.platform_plans;
create policy "platform_plans_public_read"
  on public.platform_plans
  for select
  to anon, authenticated
  using (true);

-- 5. platform_subscriptions — read your own.
drop policy if exists "platform_subscriptions_self_read" on public.platform_subscriptions;
create policy "platform_subscriptions_self_read"
  on public.platform_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

-- 6. platform_usage_events — read your own.
drop policy if exists "platform_usage_events_self_read" on public.platform_usage_events;
create policy "platform_usage_events_self_read"
  on public.platform_usage_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- 7. platform_email_log — read your own. Writes are server-only.
drop policy if exists "platform_email_log_self_read" on public.platform_email_log;
create policy "platform_email_log_self_read"
  on public.platform_email_log
  for select
  to authenticated
  using (user_id = auth.uid());

-- 8. platform_audit_log — NO client read. Admin UI uses service role.
--    (No policy defined → default-deny applies.)

-- 9. platform_config — public-readable, app-tunable settings (branding, pricing, etc.).
--    Writes are server-only via service role.
drop policy if exists "platform_config_public_read" on public.platform_config;
create policy "platform_config_public_read"
  on public.platform_config
  for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────
-- 10. Trigger: when a new auth.users row is created, mirror it into
--     platform_users. Email comes from the auth row. is_admin defaults
--     to false; promote via direct DB update or admin-panel action.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.platform_users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────
-- 11. Seed the three V1 plans. Idempotent — safe to re-run.
--     Provider IDs are filled in once Stripe products exist.
-- ─────────────────────────────────────────────────────────────────
insert into public.platform_plans (key, display_name, amount_cents, currency, interval, provider_ids, features)
values
  ('free',     'Free',     0,    'usd', 'month', '{}'::jsonb, '["core"]'::jsonb),
  ('pro',      'Pro',      4900, 'usd', 'month', '{}'::jsonb, '["core","branding_removal","multi_tenancy","advanced_billing"]'::jsonb),
  ('business', 'Business', 19900,'usd', 'month', '{}'::jsonb, '["core","branding_removal","multi_tenancy","advanced_billing","sso","audit_log","team_seats"]'::jsonb)
on conflict (key) do nothing;
