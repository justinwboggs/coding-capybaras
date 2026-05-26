# Manual migrations

These four `.sql` files are hand-written migrations that drizzle-kit
won't generate for you. They cover Row-Level Security policies, the
plan-seed data, the `platform_users.is_admin` trigger, and the manual
plan-override column.

| File                              | What it does |
| --------------------------------- | ------------ |
| `0001_rls_policies.sql`           | Enables RLS on every `platform_*` table, defines the per-user and admin policies, and seeds `platform_plans` with `free` / `pro` / `business` rows. |
| `0002_pro_tier_rls.sql`           | Adds RLS for the two Pro-tier tables introduced in Tranche 14 (support requests, business inquiries). |
| `0003_journey_rls.sql`            | RLS for `platform_journey` — users see only their own row; admins see all. |
| `0004_admin_overrides.sql`        | Adds `platform_users.manual_plan_override` (nullable text, FK to `platform_plans.key`) for admin-controlled comp grants. |

## Apply

```bash
pnpm db:apply:manual
```

This runs `scripts/apply-manual-migrations.ts` against the database at
`DATABASE_URL` (loaded from `.env.local` via `dotenv-cli`). The script
applies every `*.sql` in this directory in alphanumeric order, logs each
file as it succeeds, and exits non-zero on the first failure.

**Re-running is safe.** Every statement uses `CREATE … IF NOT EXISTS`,
`ON CONFLICT DO NOTHING`, or `IF EXISTS` guards. Apply once on first
deploy; apply again only when new manual migration files land via an
upstream pull.

## When to apply

1. **First deploy** — after `pnpm db:push` (which applies the
   auto-generated Drizzle migrations from `platform/db/migrations/`),
   run `pnpm db:apply:manual` to layer on the RLS + seed data.
2. **Upstream pulls** — if `git fetch upstream && git merge` brings new
   `0005_*.sql`, `0006_*.sql`, etc. files into this directory, re-run
   `pnpm db:apply:manual`. The already-applied files are no-ops.
3. **Production deploy** — point `DATABASE_URL` at your production
   Supabase pooled connection string and run the same command. See
   [`docs/DEPLOY.md`](../../../docs/DEPLOY.md) Step 5.

## Why these aren't in `/migrations/` proper

drizzle-kit generates schema migrations from the TypeScript schema
definitions in `platform/db/schema/`. It doesn't know about:

- RLS policies (Supabase-specific; drizzle has no abstraction).
- Plan-seed rows (data, not schema).
- The `is_admin` self-promote trigger (`0001_rls_policies.sql`).
- Manual columns added outside the drizzle schema model
  (`0004_admin_overrides.sql` predates folding the column into the TS
   schema).

Splitting these into a separate directory keeps the drizzle-generated
files clean and re-generatable, while letting hand-written SQL ride
through a single apply command.
