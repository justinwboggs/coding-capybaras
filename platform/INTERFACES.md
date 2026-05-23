# `/platform/INTERFACES.md`

This file documents the **public API surface** of the platform region — the functions, types, and conventions that code in `/website/` and `/product/` is allowed to call.

> 📦 **Placeholder — filled in during Tranche 11b-2.**
>
> Tranche 11b-1 creates this region's skeleton. The actual interface inventory
> (auth helpers, billing predicates, the email sender, journey queries, etc.)
> gets documented here once existing code moves into `/platform/` in 11b-2.

If you're working in `/product/` or `/website/` today, the source of truth is still the current code under `/lib/`. After 11b-2, this file becomes the contract — anything not listed here is internal to the platform and shouldn't be imported directly.

## `@/platform/lib/tier`

Tier-based feature gating. Reads the current platform tier from the `PLATFORM_TIER` env var (temporary single-source-of-truth pending the license system in Tranche 18). `server-only`.

```ts
export type Tier = "free" | "pro" | "business";
export const DEFAULT_TIER: Tier; // "free"

/** Current platform tier. Memoized at module level; reads PLATFORM_TIER once. */
export function getTier(): Tier;

/** Predicate for render decisions: is `current` at least `required`? */
export function tierMeets(current: Tier, required: Tier): boolean;

/** Hard gate: throws if the current tier is below `required`. Use in server
 *  actions and route handlers; pages should prefer tierMeets() to lock UI. */
export function requireTier(required: Tier): void;
```

Tier ordering is strict and monotonic: `free` < `pro` < `business`. Higher tiers include everything below them.
