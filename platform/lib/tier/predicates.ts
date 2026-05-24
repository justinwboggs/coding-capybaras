// Tier type + pure-data predicate. Lives in its own file because
// /platform/lib/tier/index.ts is marked "server-only" (it reads
// process.env.PLATFORM_TIER), and client components can't pull values
// across that boundary — only types get stripped. The predicate is pure
// data with no env reads or DB access, so it's safe to import from
// anywhere. index.ts re-exports these so server callers can keep
// importing from "@/platform/lib/tier" unchanged.
//
// Mirrors the same pattern as /platform/lib/config/branding-tokens.ts —
// see the file header there for the original rationale.

export type Tier = "free" | "pro" | "business";

export const DEFAULT_TIER: Tier = "free";

// Tier ordering is strict and monotonic: higher tiers include everything
// below them. Kept private to this module; callers go through tierMeets().
const RANK: Record<Tier, number> = { free: 0, pro: 1, business: 2 };

/**
 * Predicate: is `current` at least `required`? Use in server components
 * to decide whether to render locked vs unlocked UI, and in client
 * components that receive `tier` as a prop.
 */
export function tierMeets(current: Tier, required: Tier): boolean {
  return RANK[current] >= RANK[required];
}
