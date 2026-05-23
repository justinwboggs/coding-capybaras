# SoftwareApplication JSON-LD (tenant extension)

The boilerplate ships **WebSite** and **Organization** JSON-LD in `app/layout.tsx` —
universal across tenant types. **SoftwareApplication** is intentionally not
included by default: it needs config plumbing the boilerplate doesn't have
(`applicationCategory`, `offers`, ratings) and is wrong for tenants that aren't
shipping a software product. This guide is the copy-paste path for tenants who
want it.

## Gut check

- ✅ Your product is a software application a user signs up for or installs
- ✅ You expose public pricing you want indexed (maps to `offers`)
- ✅ You collect user reviews/ratings you want surfaced (maps to `aggregateRating`)
- ❌ You ship a service business, marketplace, content site, or anything that
  doesn't map cleanly to "an application" — WebSite + Organization are enough

## Required fields

| Field                 | Source                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `@type`               | `"SoftwareApplication"`                                                                       |
| `name`                | `getBranding().appName`                                                                       |
| `applicationCategory` | One of [Google's accepted values][cats] — e.g. `"BusinessApplication"`, `"DesignApplication"` |
| `operatingSystem`     | Typically `"Web"` for SaaS                                                                    |

Recommended optional fields when you have them: `description` (already configured
via `getMetaDescription()`), `offers` (price + currency), `aggregateRating`
(ratingValue + ratingCount), `screenshot` (hosted URL).

## Snippet

In `app/layout.tsx`, after the existing `websiteLd` / `organizationLd` blocks,
add a third schema using the same `Record<string, unknown>` shape so optional
fields drop in cleanly:

```ts
const softwareApplicationLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: appName,
  url: siteUrl,
  applicationCategory: "BusinessApplication", // pick from Google's enum
  operatingSystem: "Web",
};
if (metaDescription) softwareApplicationLd.description = metaDescription;
// Fill these in from your own config / DB when available:
// softwareApplicationLd.offers = {
//   "@type": "Offer",
//   price: "29",
//   priceCurrency: "USD",
// };
// softwareApplicationLd.aggregateRating = {
//   "@type": "AggregateRating",
//   ratingValue: "4.8",
//   ratingCount: "127",
// };
```

Then emit it as a third `<script type="application/ld+json">` alongside the
existing two:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }}
/>
```

## Verify

Paste your deployed URL into [Google's Rich Results Test][rrt] to confirm the
schema parses and shows no warnings.

## Upstream pulls

`app/layout.tsx` receives upstream boilerplate updates. If you add this schema
locally, expect a "keep ours" merge on future pulls touching the JSON-LD block —
same conflict pattern documented for other intentional `/platform/` and `/app/`
divergences.

[cats]: https://schema.org/SoftwareApplication
[rrt]: https://search.google.com/test/rich-results
