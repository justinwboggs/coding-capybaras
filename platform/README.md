# `/platform/` — Shared infrastructure

> **Audience**: tenant maintainers and AI agents working in this region. For initial setup, see [the root README](../README.md) and [`/docs/`](../docs/).

This folder is the **locked plumbing** of every app built on the boilerplate. It owns the bits no SaaS should have to reinvent: authentication, payments, transactional email, plan-based access control, the guided journey UX, configuration, and the admin surface.

## What lives here

- **`auth/`** — sign-in, sign-up, session helpers (Supabase under the hood).
- **`billing/`** — Stripe checkout, lifetime purchases, the customer portal, `canAccess(userId, feature)`.
- **`config/`** — admin-editable settings (app name, branding, pricing, email templates, feature flags). Reads from the `platform_config` table; the admin GUI is at `/config`.
- **`email/`** — `sendEmail({ to, templateKey, data })` plus the template registry. The Resend SDK is imported in exactly one file in this folder; everywhere else uses `sendEmail()`.
- **`journey/`** — the guided onboarding the user walks through after first sign-in.
- **`payments/`** — provider abstraction (Stripe today; pluggable for others later).

## Should you edit anything in here?

**Probably not.** This region is meant to stay in sync with the boilerplate so you can pull updates safely. If you modify `/platform/` files directly, those edits will conflict on the next update.

If you find a bug or need a feature, open an issue against the boilerplate. If you genuinely need a local patch, document why in a comment so future-you knows when you can drop it.

If you're building your own product features, the right place is **`/product/`** — that's yours. See `/platform/INTERFACES.md` for the public API your product code can call.
