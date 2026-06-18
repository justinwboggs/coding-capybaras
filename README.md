# Coding Capybaras

A Next.js 15 + Supabase + Stripe + Resend SaaS boilerplate scaffold. Auth,
billing, transactional email, configuration GUI, audit logging, and a
staged setup journey are wired up out of the box. You bring the product.

## Quickstart

Prerequisites: **Node 20+**, **pnpm 9+** (`npm install -g pnpm`), a
[GitHub](https://github.com) account, and accounts at
[Supabase](https://supabase.com) and (for payments)
[Stripe](https://stripe.com). Resend and Vercel come in when you want to
send email and deploy.

Set up GitHub first and use **"Sign in with GitHub"** when you create your
Supabase, Vercel, and Resend accounts — one identity links the tools, it's
what Vercel uses to pull your repo when you deploy, and it's where you'll
pull upstream updates from. Sign into **Stripe** with its own email + 2FA,
though — it's your payment account, and its access should stay independent
of GitHub.

```bash
pnpm install
cp .env.example .env.local
```

**Now set up Supabase before starting the dev server.** Supabase powers
sign-in and the database, so the app can't boot until these four vars are
filled in. (Start `pnpm dev` against an empty `.env.local` and every route
shows a "Finish your setup" page instead of crashing — that page links back
here.)

1. Create a project at
   [supabase.com/dashboard](https://supabase.com/dashboard) (the free tier
   is fine). Pick a database password and keep it handy.
2. Fill these four vars in `.env.local` from the Supabase dashboard (paths
   below reflect the recently redesigned dashboard):

   | Variable                        | Where to find it                                                                                                                                   |
   | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | The top **Connect** button, or the project home header.                                                                                            |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Settings → API Keys → "Legacy anon, service_role API keys"** tab (the default tab shows the newer publishable/secret keys). Copy the `anon` key. |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Same **"Legacy anon, service_role API keys"** tab. Copy the `service_role` key. Keep it secret — it bypasses RLS.                                  |
   | `DATABASE_URL`                  | **Connect → "Direct" card → "Transaction pooler" → Type: URI** (port 6543). Replace `[YOUR-PASSWORD]` with your database password.                 |

3. Create your database tables. A brand-new Supabase project is empty —
   these two commands build the schema and seed it. Both read
   `DATABASE_URL` from `.env.local` and are safe to re-run:

   ```bash
   pnpm db:push          # create tables from the schema (choose "Yes" when prompted)
   pnpm db:apply:manual  # RLS policies, plan seed data, first-user-admin trigger
   ```

   Skip this and sign-up will still succeed (that's Supabase auth), but the
   dashboard crashes on its first query because the tables don't exist yet.

Then start the dev server:

```bash
pnpm dev
```

Open `http://localhost:3000` and **sign up** (the first account becomes the
admin) — sign-up requires the Supabase vars above to be set. From there,
follow the staged journey at
[`/journey`](http://localhost:3000/journey), which handles Stripe, Resend,
branding, and deploy. The journey walks you through creating those accounts
and pasting their keys. Secrets land in `.env.local` — never in the
database, never in git.

## Setup docs

Past the local dev loop, three docs cover what the journey doesn't:

- [`docs/STRIPE_SETUP.md`](./docs/STRIPE_SETUP.md) — full Stripe wiring:
  products, price IDs, webhooks (local CLI + production), test vs live.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — Vercel deploy walkthrough,
  env-var checklist, custom domain, post-deploy migration apply,
  production smoke test.
- [`platform/db/migrations/manual/README.md`](./platform/db/migrations/manual/README.md)
  — the four RLS / seed-data SQL files and how to apply them
  (`pnpm db:apply:manual`).

## Architecture: three regions

| Region       | What's in it                                                     | Modify?       |
| ------------ | ---------------------------------------------------------------- | ------------- |
| `/platform/` | Auth, billing, email, payments, journey, config, admin           | No (upstream) |
| `/website/`  | Marketing surface — landing, pricing, legal, contact             | Freely        |
| `/product/`  | Authenticated app — everything behind sign-in that isn't billing | Freely        |

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

| You want to change…                 | Edit…                                                       |
| ----------------------------------- | ----------------------------------------------------------- |
| The mascot / brand SVG              | `platform/components/branding/mascot.tsx`                   |
| The default app name (pre-config)   | `platform/lib/config/index.ts` (`DEFAULT_BRANDING.appName`) |
| Landing page copy                   | `website/pages/page.tsx`                                    |
| Pricing copy                        | `website/pages/pricing/page.tsx`                            |
| Live branding (logo, primary color) | Visit `/config/branding` as an admin user                   |
| Live pricing (plan amounts, copy)   | Visit `/config/pricing` as an admin user                    |
| Email templates                     | Visit `/config/email-templates` as an admin user            |

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
pnpm db:apply:manual  # apply hand-written RLS / seed SQL migrations
pnpm new:route <path> # add a route (creates shim + page file)
pnpm sync-ai-rules    # regenerate CLAUDE.md, .cursorrules, etc.
```

## Conventions for AI assistants

[`CLAUDE.md`](./CLAUDE.md) contains the full rules. The short version:
work in the right region, don't touch `/platform/`, don't edit `/app/`
directly, prefix tables `app_` (or `platform_`), and put secrets in
`.env.local`.

## Support

<!-- COPY_TODO: pick your preferred support channel(s) and replace this
     paragraph. Options to consider: a GitHub Discussions link on the
     boilerplate repo, a Discord/Slack invite for paying tenants, an
     email address (support@…), a help-form URL. The boilerplate has no
     default — Justin/you decide what to commit to. -->

Support channels haven't been wired up yet. Open an issue against the
boilerplate repo for now, or check back once this section is filled in.

## License

See [LICENSE](./LICENSE) for the full Software License Agreement.

## Redistribution

The Coding Capybaras Boilerplate is licensed under a source-available proprietary license (see [LICENSE](./LICENSE)). In summary:

**You may:**

- Build Applications (commercial or personal) using the Software as a foundation
- Modify and customize the Software for your own use
- Distribute, sell, or commercially deploy Applications you build, provided they represent genuine new development

**You may NOT:**

- Resell, sublicense, or redistribute the Software itself as a standalone product, template, or starter kit
- Sell Applications that are substantially identical to the Software with only cosmetic changes
- Remove copyright or proprietary notices

See [LICENSE](./LICENSE) for the full terms.
