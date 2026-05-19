-- ─────────────────────────────────────────────────────────────────
-- 0003_journey_rls.sql
--
-- Hand-written, applied AFTER db/migrations/0003_loving_fantastic_four.sql.
-- RLS for platform_journey: users read/write their own row, admins read all.
-- The trigger in 0001 created platform_users rows; we don't auto-create
-- platform_journey here — getOrCreateJourney() in lib/journey/queries does
-- that lazily on first access.
--
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/manual/0003_journey_rls.sql
-- Or via the Supabase SQL Editor.
--
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────

alter table public.platform_journey enable row level security;

-- Self read/write
drop policy if exists "platform_journey_self_read"   on public.platform_journey;
create policy "platform_journey_self_read"
  on public.platform_journey
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "platform_journey_self_insert" on public.platform_journey;
create policy "platform_journey_self_insert"
  on public.platform_journey
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "platform_journey_self_update" on public.platform_journey;
create policy "platform_journey_self_update"
  on public.platform_journey
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin read-all (for any future admin tooling that lists journey progress).
drop policy if exists "platform_journey_admin_read" on public.platform_journey;
create policy "platform_journey_admin_read"
  on public.platform_journey
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );
