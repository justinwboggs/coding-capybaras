# `/product/` — Where your app gets built

This folder is **yours**. This is where the actual product — the thing your users sign in to use — lives. Build whatever you want. Platform updates won't overwrite anything in here.

## What lives here

- **`pages/`** — every authenticated route in your app (the dashboard, settings pages, your core feature, anything that requires sign-in).
- **`components/`** — your product UI. Use shadcn primitives from `@/platform/components/ui/*` for the low-level building blocks.
- **`lib/`** — your product-specific server logic, helpers, types.
- **`db/schema/app.ts`** — your database tables. **Always prefix table names with `app_`** (e.g. `app_projects`, `app_documents`). The `platform_` prefix is reserved for the locked plumbing region.
- **`api/`** — your product's route handlers (webhooks for third-party services your product talks to, API endpoints your frontend hits).

## Adding a new route

**Never edit `/app/` directly.** It contains thin routing shims that point here. To add a new route, run:

```bash
pnpm new:route /app/(authed)/app/<name>
```

It creates the shim under `/app/` and the page file under `/product/pages/` in one shot.

## Talking to platform features

For auth, billing, email, configuration, and feature gating, use the public interfaces in `/platform/INTERFACES.md`. Don't reach into `/platform/lib/*` internals — those are subject to change between boilerplate updates.

## Tables

Your tables go in `/product/db/schema/app.ts`. Generate migrations with `pnpm db:generate` after editing the schema.
