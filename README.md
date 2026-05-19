# Coding Capybaras

A Next.js 15 + Supabase + Stripe + Resend SaaS boilerplate scaffold. Auth,
billing, transactional email, configuration GUI, audit logging, and a
staged setup journey are wired up out of the box. You bring the product.

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open `http://localhost:3000`, sign up, and follow the staged journey
at `/journey`. The journey walks you through creating accounts and pasting
keys for Supabase, Stripe, Resend, and the rest. Secrets land in
`.env.local` — never in the database, never in git.

## Architecture: three regions

| Region        | What's in it                                                     | Modify?            |
| ------------- | ---------------------------------------------------------------- | ------------------ |
| `/platform/`  | Auth, billing, email, payments, journey, config, admin           | No (upstream)      |
| `/website/`   | Marketing surface — landing, pricing, legal, contact             | Freely             |
| `/product/`   | Authenticated app — everything behind sign-in that isn't billing | Freely             |

`/app/` at the root is a thin routing manifest. Don't edit it directly —
use `pnpm new:route <path>` to add a new route.

The full conventions for working in each region live in
[`CLAUDE.md`](./CLAUDE.md).

## Pulling updates from upstream

The platform layer ships from a shared upstream repo. Wire it up once:

```bash
git remote add upstream git@github.com:justinwboggs/coding-capybaras.git
```

To pull updates:

```bash
git fetch upstream
git merge upstream/main
```

Files you customize in `/platform/` will conflict on pull — most often
`platform/components/branding/mascot.tsx` (your brand SVG) and
`platform/lib/config/index.ts` (your `DEFAULT_BRANDING.appName`). Resolve
by keeping your local version. Stay out of the rest of `/platform/` and
upstream pulls stay clean.

## Where to start customizing

| You want to change…                  | Edit…                                                     |
| ------------------------------------ | --------------------------------------------------------- |
| The mascot / brand SVG               | `platform/components/branding/mascot.tsx`                 |
| The default app name (pre-config)    | `platform/lib/config/index.ts` (`DEFAULT_BRANDING.appName`) |
| Landing page copy                    | `website/pages/page.tsx`                                  |
| Pricing copy                         | `website/pages/pricing/page.tsx`                          |
| Live branding (logo, primary color)  | Visit `/config/branding` as an admin user                 |
| Live pricing (plan amounts, copy)    | Visit `/config/pricing` as an admin user                  |
| Email templates                      | Visit `/config/email-templates` as an admin user          |

The `/config/*` surfaces write to `platform_config` — runtime config that
flows through to the live site without a redeploy.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Drizzle ·
Supabase · Stripe · Resend · Sentry · PostHog.

## Useful commands

```bash
pnpm dev              # start the dev server
pnpm typecheck        # tsc --noEmit
pnpm lint             # next lint
pnpm build            # production build
pnpm db:generate      # generate Drizzle migrations
pnpm db:push          # push schema to your Supabase Postgres
pnpm new:route <path> # add a route (creates shim + page file)
pnpm sync-ai-rules    # regenerate CLAUDE.md, .cursorrules, etc.
```

## Conventions for AI assistants

[`CLAUDE.md`](./CLAUDE.md) contains the full rules. The short version:
work in the right region, don't touch `/platform/`, don't edit `/app/`
directly, prefix tables `app_` (or `platform_`), and put secrets in
`.env.local`.
