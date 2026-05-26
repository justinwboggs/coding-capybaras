# Deploy to Vercel

Step-by-step from "I cloned the repo" to "my custom domain is live with
HTTPS, and real users can sign up and pay."

This guide assumes Vercel as the deploy target — the boilerplate ships
with Vercel-friendly defaults (Next.js 15 App Router, edge-safe where
possible, Node runtime forced on webhook routes). Other hosts (Cloudflare
Pages, Render, self-host) can work but aren't covered here.

## Prerequisites

- A working local setup: `pnpm dev` runs cleanly, you've finished
  [Stripe setup](./STRIPE_SETUP.md) at least in test mode, and you can
  sign up + check out locally.
- Your code is in a GitHub repository (Vercel reads from GitHub for
  preview/production builds).
- A [Vercel account](https://vercel.com/signup) with the GitHub
  integration installed.
- A custom domain you control (optional but recommended for production).
- Your Supabase project is reachable from the public internet (it is by
  default — Vercel needs to connect to it).

## Step 1 — Push the repo to GitHub

If you haven't already:

```bash
git remote add origin git@github.com:<your-username>/<your-repo>.git
git push -u origin main
```

Private repo is fine. Vercel just needs read access (granted by the GitHub
integration).

## Step 2 — Import to Vercel

1. Vercel dashboard → **Add New → Project**.
2. Select your GitHub repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Root Directory**: leave as `.` (the repo root).
5. **Build & Output Settings**:
   - **Build command**: leave as default (`next build`).
   - **Output directory**: leave as default (`.next`).
   - **Install command**: **OVERRIDE to `pnpm install`** (Vercel defaults
     to `npm install`, which doesn't honor the lockfile and may install
     wrong versions). Toggle "Override" and type `pnpm install`.

6. Don't deploy yet — configure env vars first (Step 3). If you deploy
   without them the build will fail at runtime when the app tries to
   reach Supabase / Stripe / etc.

## Step 3 — Configure environment variables

Vercel → your project → **Settings → Environment Variables**. Add each
of the following. Mark scope as **Production, Preview, Development**
unless noted.

### Required for any deploy

| Variable                          | Where to find it                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`             | Your production URL, e.g. `https://app.example.com`. **Must match the live domain exactly** — used in metadata, OG cards, redirects. |
| `NODE_ENV`                        | `production` (Vercel sets this automatically; you can omit). |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase dashboard → Project Settings → API → Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Same page → `anon` `public` key. |
| `SUPABASE_SERVICE_ROLE_KEY`       | Same page → `service_role` `secret` key. **Server-only** — Vercel encrypts it; never exposed to the client bundle. |
| `DATABASE_URL`                    | Supabase dashboard → Project Settings → Database → Connection string → **Transaction pooler**. The pooled URL (port 6543), not the direct connection. |
| `PLATFORM_TIER`                   | `free` (default) or `pro` / `business` if you've activated higher-tier features for this deployment. |

### Required for accepting payments

If your launch tier needs Stripe (anything above Free), add:

| Variable                              | Where to find it                                       |
| ------------------------------------- | ------------------------------------------------------ |
| `PAYMENT_PROVIDER`                    | `stripe` (or omit — `stripe` is the default).          |
| `STRIPE_SECRET_KEY`                   | Stripe dashboard → Developers → API keys → **Live mode** → Secret key (`sk_live_…`). For test deploys use `sk_test_…`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Same page → Publishable key (`pk_live_…` or `pk_test_…`). |
| `STRIPE_WEBHOOK_SECRET`               | Stripe dashboard → Developers → Webhooks → your endpoint → Signing secret. Created in Step 7 below. |

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for the full Stripe walkthrough.

### Required for sending email

| Variable          | Where to find it                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`  | [Resend dashboard](https://resend.com) → API Keys.                                                   |
| `EMAIL_FROM`      | `"Your Brand <hello@yourdomain.com>"` — must be a verified sender in Resend (verify your domain first). For testing without a verified domain, Resend's `onboarding@resend.dev` sends only to your Resend account email. |
| `SUPPORT_EMAIL`   | Where contact-form submissions and priority-support requests are routed (your inbox).                |

### Optional — wire later if you want them

| Variable                          | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`          | Sentry error reporting (client). Setup not yet wired in code — env var slot present for future. |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Sentry build-time source maps upload. Same status. |
| `NEXT_PUBLIC_POSTHOG_KEY`         | PostHog product analytics (client). Setup not yet wired in code. |
| `NEXT_PUBLIC_POSTHOG_HOST`        | Defaults to `https://us.i.posthog.com`. Override for EU.         |
| `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` | Used by the in-app journey's repo-creation step. |
| `VERCEL_OAUTH_CLIENT_ID`, `VERCEL_OAUTH_CLIENT_SECRET` | Used by the journey's deploy step. |
| `BCPARTNERS_WEBHOOK_SECRET`       | Alternate payment provider stub. Leave unset unless you're plugging in a custom provider. |

### Vars to NOT set in Vercel

Don't add `NODE_ENV=development` (Vercel manages it). Don't paste
`.env.local` wholesale — the file is local-dev convenience; production
gets a curated subset.

## Step 4 — First deploy

After saving env vars, click **Deploy** (or trigger from the repo via
`git push`). Vercel will:

1. Clone the repo.
2. Run `pnpm install` (because you overrode the install command).
3. Run `next build`.
4. Deploy the build to a `*.vercel.app` URL.

If the build fails, check **Vercel → Deployments → failed build →
Build Logs**. The most common failures:

- **`DATABASE_URL is not set`**: you skipped the env var registration or
  scoped it wrong. Verify it's set for the "Production" environment.
- **Type errors**: run `pnpm typecheck` locally first.
- **`pnpm not found`**: you didn't override the install command. Go back
  to Step 2.

## Step 5 — Apply manual migrations against production

The auto-generated Drizzle migrations run when you push schema changes,
but the **manual** SQL files (RLS policies, plan seed data) live in
`platform/db/migrations/manual/` and must be applied separately. You
already did this locally; do it again against your production database:

```bash
# From your local machine, with DATABASE_URL temporarily pointing at prod:
DATABASE_URL="<your-prod-supabase-pooled-url>" pnpm db:apply:manual
```

Or run each SQL file manually in the Supabase SQL editor (Production
project → SQL → New query → paste contents, run). See
[`platform/db/migrations/manual/README.md`](../platform/db/migrations/manual/README.md)
for the full apply path.

> Re-running is safe — the SQL files use `CREATE … IF NOT EXISTS` and
> `ON CONFLICT DO NOTHING` patterns.

## Step 6 — Register the Stripe webhook for production

Now that your app has a real domain (even if it's still
`your-project.vercel.app`), register the webhook:

1. Stripe dashboard → **live mode** → Developers → Webhooks → **+ Add endpoint**.
2. Endpoint URL: `https://<your-domain>/api/webhooks/stripe` (use the
   `*.vercel.app` URL if you haven't attached a custom domain yet — you
   can update it later).
3. Subscribe to the seven events (see [STRIPE_SETUP.md Step 7](./STRIPE_SETUP.md)).
4. Copy the signing secret (`whsec_…`).
5. Vercel → Settings → Environment Variables → update `STRIPE_WEBHOOK_SECRET`.
6. **Redeploy** (env var changes don't take effect until the next deploy):
   Vercel → Deployments → latest → **⋯ → Redeploy**.

If you later move to a custom domain, repeat steps 2 + 4 + 5 with the new
URL — Stripe ties the signing secret to the endpoint URL.

## Step 7 — Attach a custom domain

1. Vercel → your project → Settings → Domains → **Add**.
2. Type your domain (e.g. `app.example.com`).
3. Vercel shows the DNS records you need to add at your registrar.
   Typically:
   - For a subdomain (`app.example.com`): a `CNAME` to `cname.vercel-dns.com`.
   - For an apex domain (`example.com`): an `A` record to Vercel's IPs
     (shown in the dashboard), or use Vercel's nameservers.
4. Add the records at your registrar (Cloudflare, Route 53, Namecheap, etc.).
5. Wait for DNS propagation (usually under 5 minutes; can take an hour).
6. Vercel automatically provisions an HTTPS certificate.
7. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to match the new
   domain exactly. **Redeploy.**
8. Update your Stripe webhook endpoint URL (Step 6) to point at the new
   domain. Copy the new signing secret if Stripe regenerates one.

## Step 8 — Production smoke test

Walk through every critical path against production:

- [ ] Visit the marketing landing (`/`). Page renders with your branding,
      `<title>` shows your `appName`, `<meta description>` shows your
      tagline.
- [ ] Sign up with a real email. Confirm the welcome email lands in your
      inbox (check spam if Resend domain isn't verified).
- [ ] Sign in. The `/journey` flow loads — for a deployed tenant, you'll
      likely have `onboardingMode = "skip"` configured; otherwise walk
      through it.
- [ ] Navigate to `/pricing`, click upgrade on Pro, complete a **real**
      checkout with a live card.
- [ ] Confirm `/account/billing` shows the active subscription.
- [ ] Confirm the Stripe dashboard shows a new customer + subscription
      under your live account.
- [ ] In Stripe → Webhooks → Recent deliveries: confirm 200 responses for
      `checkout.session.completed` and `customer.subscription.created`.
- [ ] Confirm `platform_subscriptions` has the row (Supabase SQL editor).
- [ ] Click **Manage billing** → opens Stripe's hosted customer portal.
      Cancel the subscription as a test. Verify cancellation propagates
      back to your app on the next page load.

If any step fails, see [STRIPE_SETUP.md → Troubleshooting](./STRIPE_SETUP.md#troubleshooting).

## Common pitfalls

**`NEXT_PUBLIC_*` env var changes don't take effect.** These are baked
into the client bundle at build time. After updating any `NEXT_PUBLIC_*`
var, you must **redeploy** — restarting the dev server isn't enough on
Vercel.

**Service role key in client logs.** If `SUPABASE_SERVICE_ROLE_KEY`
appears anywhere in browser DevTools, you've leaked it. The key should
only be referenced from server components, server actions, and API
routes. The `@/platform/lib/supabase/admin.ts` module has `import
"server-only"` at the top — keep your usage downstream of that boundary.

**`NEXT_PUBLIC_APP_URL` mismatch.** This URL drives OG cards, sitemap,
email links, and (importantly) Stripe checkout success/cancel URLs. If
it doesn't match your live domain, checkout redirects break. Update it
whenever you change domains and redeploy.

**Webhook URL mismatch.** Stripe ties the signing secret to the endpoint
URL. If you register `https://example.com/api/webhooks/stripe` but your
app responds at `https://www.example.com/api/webhooks/stripe`, every
delivery 404s. Pick a canonical domain and stick to it.

**Build succeeds but the page errors at runtime.** Almost always a
missing env var that surfaces only on first request (e.g. lazy-init
clients like Stripe). Check Vercel → Runtime Logs for the first failed
request and look for `… is not set`.

## Updates from upstream

When the boilerplate ships an update:

```bash
git fetch upstream
git merge upstream/main
```

If the update includes new manual migrations, you'll need to re-run
`pnpm db:apply:manual` against production after deploying the merge.
The script is idempotent — files you've already applied are no-ops.

See the root README's "Pulling updates from upstream" section for
conflict-resolution tips.
