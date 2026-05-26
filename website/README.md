# `/website/` — Your marketing layer

> **Audience**: tenant maintainers and AI agents working in this region. For initial setup, see [the root README](../README.md) and [`/docs/`](../docs/).

This folder is **yours**. Customize freely — platform updates won't overwrite anything in here.

This is where the public-facing pages of your app live: landing page, pricing, FAQ, about, blog, docs, terms, privacy. Anything a not-yet-signed-up visitor sees. The authenticated app (after sign-in) belongs in `/product/`.

## What lives here

- **`pages/`** — your landing page, pricing copy, marketing pages, blog/docs sections.
- **`components/`** — reusable bits that are specific to your marketing (hero blocks, testimonial cards, pricing tables). For low-level building blocks (Button, Card, Dialog, Input), use the shared shadcn primitives at `@/platform/components/ui/*` — don't reinvent.
- **`content/`** — copy-as-data (MDX, JSON, etc.) if you want to separate writing from layout. Optional.
- **`public/`** — static assets that are specific to your marketing (OG images, logos, favicons).

## How it ties in

Routes here are wired up under `/app/(marketing)/` via thin routing shims. Read configurable values (app name, primary color, tagline, etc.) via `@/platform/lib/config` — never hardcode them, so admin edits in `/config/branding` flow through.

## Conventions

- Don't import from `/platform/lib/*` internals — use the public interfaces in `/platform/INTERFACES.md`.
- Don't modify anything in `/platform/` from here. If a marketing tweak needs platform changes, that's a sign it should live in `/platform/` instead.
