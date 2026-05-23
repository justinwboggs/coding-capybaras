import "server-only";

// ─────────────────────────────────────────────────────────────────
// Tier-based feature gating. The current tier is read from the
// PLATFORM_TIER env var — a temporary single-source-of-truth pending
// the real license system (Tranche 18), at which point this module
// will read from /platform/lib/license/ with env var as a fallback.
//
// Tier ordering: free < pro < business. Higher tiers include
// everything below them (tierMeets(current, required) is monotonic).
// ─────────────────────────────────────────────────────────────────

export type Tier = "free" | "pro" | "business";

export const DEFAULT_TIER: Tier = "free";

const VALID_TIERS = new Set<Tier>(["free", "pro", "business"]);
const RANK: Record<Tier, number> = { free: 0, pro: 1, business: 2 };

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
 * Predicate: is `current` at least `required`? Use in server components
 * to decide whether to render locked vs unlocked UI.
 */
export function tierMeets(current: Tier, required: Tier): boolean {
  return RANK[current] >= RANK[required];
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
