import "server-only";

// ─────────────────────────────────────────────────────────────────
// Tier-based feature gating. The current tier is read from the
// PLATFORM_TIER env var — a temporary single-source-of-truth pending
// the real license system (Tranche 18), at which point this module
// will read from /platform/lib/license/ with env var as a fallback.
//
// Pure-data parts (Tier type, DEFAULT_TIER, tierMeets predicate) live
// in ./predicates so client components can import them without
// tripping the Server Components boundary check on this file. They're
// re-exported here so server callers can keep importing from
// @/platform/lib/tier unchanged.
// ─────────────────────────────────────────────────────────────────

import { type Tier, DEFAULT_TIER, tierMeets } from "./predicates";
export { type Tier, DEFAULT_TIER, tierMeets };

const VALID_TIERS = new Set<Tier>(["free", "pro", "business"]);

// Memoize at module level: env vars don't change at runtime, and this
// keeps the invalid-value warning from firing on every call.
let cached: Tier | undefined;

/**
 * Current platform tier. Reads PLATFORM_TIER once, validates against
 * the allowed set, falls back to "free" with a warning on invalid input.
 */
export function getTier(): Tier {
  if (cached !== undefined) return cached;
  const raw = process.env.PLATFORM_TIER;
  if (raw && VALID_TIERS.has(raw as Tier)) {
    cached = raw as Tier;
  } else {
    if (raw) {
      console.warn(
        `[tier] invalid PLATFORM_TIER="${raw}" — defaulting to "${DEFAULT_TIER}"`,
      );
    }
    cached = DEFAULT_TIER;
  }
  return cached;
}

/**
 * Hard gate: throws if the current tier is below `required`. Use in
 * server actions and route handlers that should never execute on a
 * lower tier (the caller decides whether to catch and return an error
 * or let the throw propagate as a 500). Pages that want to lock UI
 * gracefully should use tierMeets() instead.
 */
export function requireTier(required: Tier): void {
  const current = getTier();
  if (!tierMeets(current, required)) {
    throw new Error(
      `Requires "${required}" tier; current is "${current}".`,
    );
  }
}
