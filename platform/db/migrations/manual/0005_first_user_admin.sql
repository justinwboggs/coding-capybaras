-- ─────────────────────────────────────────────────────────────────
-- 0005_first_user_admin.sql
--
-- First-user-wins admin bootstrap. The very first row inserted into
-- platform_users is promoted to is_admin = true; all subsequent rows
-- keep the column default (false). This is the boilerplate's launch-day
-- answer to "how does a fresh tenant get into /config and /admin" —
-- without it, a brand-new deploy has no in-product path to admin.
--
-- WHY a BEFORE INSERT trigger on platform_users (not on auth.users):
-- there are TWO insert paths into platform_users:
--   1. The auth.users AFTER INSERT trigger (handle_new_auth_user, in
--      0001) — the normal signup path.
--   2. The app-layer self-heal in getCurrentUser() (platform/lib/auth/
--      index.ts) — runs if the trigger lost the race or wasn't installed
--      when an early user signed up.
-- Putting first-user-wins at the table boundary means BOTH paths
-- inherit it automatically, with no app-layer changes and no edits to
-- the existing auth.users trigger.
--
-- WHY security definer: the NOT EXISTS check must bypass RLS so it
-- sees all rows. A SECURITY INVOKER function could read an RLS-filtered
-- (falsely-empty) view and wrongly promote a non-first user.
--
-- ORDERING: Postgres applies column defaults BEFORE firing BEFORE INSERT
-- triggers, so both insert paths arrive at this trigger with
-- is_admin = false (the column default from platform.ts:
-- `boolean("is_admin").notNull().default(false)`). The trigger flips it
-- to true only on the empty-table case.
--
-- ON CONFLICT: getCurrentUser's self-heal uses ON CONFLICT (id) DO NOTHING.
-- BEFORE INSERT triggers fire before conflict resolution; if a conflict
-- occurs the table is non-empty so NOT EXISTS is false (no promotion)
-- and the row is discarded by the conflict handler anyway. No harm.
--
-- EXPLICIT is_admin=true INSERTS: the `is not true` guard means a row
-- inserted with is_admin = true (future invite/promote-admins flow) is
-- left alone — the trigger never demotes.
--
-- IDEMPOTENT + SAFE ON EXISTING DATABASES: CREATE OR REPLACE FUNCTION
-- and the drop-then-create trigger pattern make re-runs no-ops. NOT
-- EXISTS is false once any user exists, so applying this to a populated
-- production database promotes nobody — it becomes a permanent no-op
-- after bootstrap.
--
-- KNOWN ACCEPTABLE LIMITATION: two truly-simultaneous first signups
-- could both observe NOT EXISTS = true and both be promoted. Fine — on
-- a fresh deploy the operator signs up alone during setup; the race
-- window is the empty-table case only. No locking mechanism needed.
--
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/manual/0005_first_user_admin.sql
-- Or via Supabase SQL editor → paste this file.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.set_first_user_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is not true then
    if not exists (select 1 from public.platform_users) then
      new.is_admin := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists platform_users_set_first_admin on public.platform_users;
create trigger platform_users_set_first_admin
  before insert on public.platform_users
  for each row execute function public.set_first_user_admin();
