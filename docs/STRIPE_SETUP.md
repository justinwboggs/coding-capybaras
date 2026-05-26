# Stripe setup

Step-by-step from "I have a Stripe account" to "checkout works in production."

If you already have Stripe wired and just need the pieces this boilerplate
expects, jump to [The 4-line checklist](#the-4-line-checklist) at the bottom.

## Prerequisites

- A Stripe account ([dashboard.stripe.com](https://dashboard.stripe.com)).
- Local dev running (`pnpm dev`) with a working Supabase connection — the
  `platform_plans` table must already be seeded. If you haven't applied the
  manual migrations yet, run `pnpm db:apply:manual` first (see
  [`platform/db/migrations/manual/README.md`](../platform/db/migrations/manual/README.md)).
- The Stripe CLI installed (optional but strongly recommended for local
  webhook forwarding): `brew install stripe/stripe-cli/stripe` on macOS, or
  see [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) for
  other platforms.

## Step 1 — Get your API keys (test mode)

1. In the Stripe dashboard, toggle to **test mode** (top right).
2. Go to **Developers → API keys**.
3. Copy the **Publishable key** (starts with `pk_test_…`).
4. Reveal and copy the **Secret key** (starts with `sk_test_…`).

Paste both into your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

Restart `pnpm dev` after editing `.env.local`.

## Step 2 — Create your products in Stripe

The boilerplate ships three plans seeded in `platform_plans`:

| Key        | Display name | Price (display) | Needs Stripe product? |
| ---------- | ------------ | --------------- | --------------------- |
| `free`     | Free         | $0 / month      | **No** — free tier has no Stripe interaction |
| `pro`      | Pro          | $49 / month     | Yes — one recurring price |
| `business` | Business     | $199 / month    | Yes — one recurring price |

For Pro and Business, in **test mode**:

1. **Products → + Add product**.
2. Name: `Pro` (or whatever matches your `display_name` in `platform_plans`).
3. Pricing: **Recurring**, **$49.00** (or your value), **Monthly**.
4. **Save product**.
5. On the product detail page, click the price row — copy the price ID
   (starts with `price_…`). You'll need this in Step 3.
6. Repeat for `Business` at $199/month.

> If you charge in a currency other than USD, set it on the price. The
> boilerplate honors whatever currency the Stripe price uses; the
> `currency` column on `platform_plans` is for display only.

## Step 3 — Wire your price IDs into `platform_plans`

Each `platform_plans` row has a `provider_ids` JSONB column. The Stripe
provider reads the price ID from `provider_ids.stripe`. New plans seed with
`provider_ids = {}`; you must populate it before checkout will work.

Run this against your Supabase database (use the SQL editor in the Supabase
dashboard, or `psql "$DATABASE_URL"`):

```sql
UPDATE platform_plans
SET provider_ids = jsonb_set(provider_ids, '{stripe}', '"price_YOUR_PRO_ID"')
WHERE key = 'pro';

UPDATE platform_plans
SET provider_ids = jsonb_set(provider_ids, '{stripe}', '"price_YOUR_BUSINESS_ID"')
WHERE key = 'business';
```

Replace `price_YOUR_PRO_ID` / `price_YOUR_BUSINESS_ID` with the IDs you
copied in Step 2. **Keep the double quotes inside the single quotes** —
that's JSONB string syntax.

Verify:

```sql
SELECT key, display_name, provider_ids FROM platform_plans;
```

You should see `{"stripe": "price_..."}` populated for Pro and Business.
Free should still have `{}`.

## Step 4 — Local webhook forwarding (Stripe CLI)

For local dev, Stripe needs to deliver webhooks to your `localhost`. The
Stripe CLI tunnels production webhooks to your local server.

1. Authenticate the CLI once:

   ```bash
   stripe login
   ```

2. Forward to your local endpoint (the boilerplate's webhook route is
   `/api/webhooks/stripe`):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. The CLI prints a webhook signing secret like:

   ```
   Ready! Your webhook signing secret is whsec_abc123…
   ```

   Copy this and paste into `.env.local`:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```

4. Restart `pnpm dev`. Leave `stripe listen` running in its own terminal —
   it must stay up while you test checkout.

> The CLI secret is different from the production webhook secret you'll
> create in Step 7. Each `stripe listen` session generates a new one; treat
> it as ephemeral.

## Step 5 — Test the checkout flow

1. Sign up in your local app (`pnpm dev`, `http://localhost:3000`).
2. Visit `/pricing`. Click upgrade on Pro.
3. You'll be redirected to Stripe's hosted checkout in test mode.
4. Use Stripe's [test card](https://stripe.com/docs/testing#cards): card
   number `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
5. Complete the checkout. You'll be redirected back to
   `/account/billing?checkout=success`.
6. In your `stripe listen` terminal, you should see events stream through:

   ```
   2026-05-25 12:34:56  --> checkout.session.completed [evt_…]
   2026-05-25 12:34:56  --> customer.subscription.created [evt_…]
   2026-05-25 12:34:56  --> invoice.payment_succeeded [evt_…]
   ```

7. In the dashboard at `/account/billing`, your plan should now read **Pro**.

8. Verify in the database:

   ```sql
   SELECT user_id, plan_key, status, current_period_end
   FROM platform_subscriptions
   ORDER BY created_at DESC LIMIT 1;
   ```

   Expect one row, `status = 'active'`, `plan_key = 'pro'`.

If any of these steps don't fire, see [Troubleshooting](#troubleshooting).

## Step 6 — The events the handler subscribes to

The webhook route at `/api/webhooks/stripe` handles these Stripe events:

| Stripe event                        | Internal action |
| ----------------------------------- | --------------- |
| `customer.subscription.created`     | Upsert subscription, mark active |
| `customer.subscription.updated`     | Update plan/status/period_end |
| `customer.subscription.deleted`     | Mark canceled, send cancellation email |
| `invoice.payment_succeeded`         | Send payment-succeeded email |
| `invoice.payment_failed`            | Send payment-failed email |
| `customer.updated`                  | Sync customer record |
| `checkout.session.completed`        | One-time/lifetime purchases only — subscription completions are handled by the `subscription.created` event above |

You'll register all of these when you set up the production webhook in
Step 7. Stripe CLI's `stripe listen` (Step 4) forwards every event by
default, so local dev needs no further configuration.

## Step 7 — Production webhook registration

Once your app is deployed (see [DEPLOY.md](./DEPLOY.md)), wire production:

1. **Stripe dashboard → Developers → Webhooks → + Add endpoint**.
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`.
3. Select events to send. Click **+ Select events** and add the seven from
   the table in Step 6.
4. Click **Add endpoint**.
5. On the endpoint detail page, click **Reveal** under "Signing secret" and
   copy the value (`whsec_…`).
6. Add it to your Vercel production env vars as `STRIPE_WEBHOOK_SECRET`.
   (Vercel dashboard → your project → Settings → Environment Variables.)
   Redeploy after saving.

> **Important**: the production signing secret is different from the
> `stripe listen` CLI secret. Don't mix them up. The CLI one is for local
> dev only.

## Step 8 — Switch to live keys for production

When you're ready to accept real payments:

1. Toggle the Stripe dashboard from **test mode** to **live mode**.
2. **Developers → API keys**, copy the live keys (`pk_live_…`, `sk_live_…`).
3. In Vercel: update `STRIPE_SECRET_KEY` and
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the live values.
4. Re-create your Pro / Business products in **live mode** (Step 2 again —
   test-mode products don't carry over). You'll get new live price IDs.
5. Run the SQL UPDATEs from Step 3 against your **production** Supabase,
   substituting the live price IDs.
6. Re-register the webhook endpoint in **live mode** (Step 7 again). The
   live signing secret is different from the test one.

Plan to keep test and live separate end-to-end. Don't share env vars across
modes; don't run `stripe listen` against live keys in production.

## Customer portal

The boilerplate uses Stripe's hosted customer portal for subscription
management (cancel, change plan, update card). It's enabled by default for
new Stripe accounts — no extra setup needed.

If you want to customize what users can do, configure it at
**Stripe dashboard → Settings → Billing → Customer portal**.

## Troubleshooting

**Webhook signature verification fails (400 in `stripe listen` output).**
Your `STRIPE_WEBHOOK_SECRET` in `.env.local` doesn't match the value
`stripe listen` printed. Copy it again, restart `pnpm dev`.

**Checkout returns "Plan not configured for this payment provider".**
`provider_ids.stripe` is empty for the plan you clicked. Run Step 3.

**Webhook fires but `platform_subscriptions` stays empty.**
Check your `stripe listen` output — if you see the event delivered but a
non-2xx response, look at your Next.js dev server logs for the error. Most
commonly: the price ID in your Stripe product doesn't match the one in
`provider_ids.stripe`. The webhook handler resolves which plan to write by
looking up the price ID in `platform_plans.provider_ids`.

**Production: webhook events not arriving.**
Verify the endpoint URL matches exactly (including the scheme and trailing
slash if any). Check **Stripe dashboard → Developers → Webhooks → your
endpoint → Recent deliveries** for delivery attempts and response codes.

**Pro plan shows but billing page says "no active subscription".**
The webhook completed but `platform_subscriptions` wasn't updated — likely
the `checkout.session.completed` fired but `customer.subscription.created`
didn't. Verify both events are subscribed (Step 7).

## The 4-line checklist

If you know Stripe and just need the boilerplate-specific bits:

1. Create Pro + Business products in Stripe (Free is local-only).
2. `UPDATE platform_plans SET provider_ids = jsonb_set(provider_ids, '{stripe}', '"price_..."') WHERE key = '<plan>';`
3. Webhook endpoint: `<domain>/api/webhooks/stripe`, 7 events (subscription created/updated/deleted, invoice payment succeeded/failed, customer.updated, checkout.session.completed).
4. Local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, copy the printed `whsec_…` to `STRIPE_WEBHOOK_SECRET`.
