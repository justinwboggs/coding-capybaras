// ─────────────────────────────────────────────────────────────────
// Billing / access-control helpers. Server-only — these read
// subscription state straight from the DB and never trust a
// client-supplied plan or feature claim.
//
// Note on location: SPEC.md §6 describes `/lib/platform/billing.ts`,
// but that layout is the *starter template's*. The platform repo
// keeps `/lib/*` flat (auth, db, email, payments, …) per CLAUDE.md,
// so this lives at `/lib/billing`.
// ─────────────────────────────────────────────────────────────────
import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";

import { db } from "@/platform/db/client";
import {
  platformPaymentCustomers,
  platformPlans,
  platformSubscriptions,
  type PlatformPaymentCustomer,
  type PlatformPlan,
  type PlatformSubscription,
} from "@/platform/db/schema/platform";
import { getProvider } from "@/platform/lib/payments";

export type PlanKey = "free" | "pro" | "business";

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
}

/**
 * Every feature key canAccess() can be asked about. The *set* of possible
 * features is code — each maps to a real gated capability. Which plan
 * includes which feature is configuration (platform_plans.features), edited
 * in /config/feature-flags. Keep this in sync as gated features are added.
 */
export const FEATURE_REGISTRY: FeatureDef[] = [
  {
    key: "core",
    label: "Core platform",
    description:
      "Auth, payments, email, and deploy — the complete free baseline.",
  },
  {
    key: "branding_removal",
    label: "Branding removal",
    description: "Remove the “Built with Platform” badge from the footer.",
  },
  {
    key: "multi_tenancy",
    label: "Teams & multi-tenancy",
    description: "Organizations with multiple members.",
  },
  {
    key: "advanced_billing",
    label: "Advanced billing",
    description: "Usage-based and metered pricing options.",
  },
  {
    key: "sso",
    label: "SSO / SAML",
    description: "Enterprise single sign-on.",
  },
  {
    key: "audit_log",
    label: "Audit logs",
    description: "Exportable audit trail of account activity.",
  },
  {
    key: "team_seats",
    label: "Team seats",
    description: "Unlimited members per organization.",
  },
  {
    key: "integrations.access",
    label: "Integration marketplace",
    description:
      "Access to the curated integration library (analytics, email, CRM, …). New integrations land weekly.",
  },
  {
    key: "support.priority",
    label: "Priority support",
    description:
      "Direct email support — questions answered first, before public-tier inquiries.",
  },
  {
    key: "updates.notifications",
    label: "Boilerplate update notifications",
    description:
      "In-app indicator when the platform ships a new version, with a guided pull-from-upstream prompt.",
  },
];

export const FEATURE_KEYS: string[] = FEATURE_REGISTRY.map((f) => f.key);

// Subscription statuses that entitle a user to their plan's features.
// past_due / canceled / incomplete fall back to the free entitlement set.
const ENTITLED_STATUSES = new Set(["active", "trialing"]);

// Display order for the pricing catalog. Anything unknown sorts last.
const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, business: 2 };

/**
 * The full pricing catalog from platform_plans, ordered free → pro →
 * business. platform_plans is the source of truth — Stripe's catalog is
 * downstream of ours. Cached per request.
 */
export const getActivePlans = cache(async (): Promise<PlatformPlan[]> => {
  const plans = await db.select().from(platformPlans);
  return plans.sort(
    (a, b) => (PLAN_ORDER[a.key] ?? 99) - (PLAN_ORDER[b.key] ?? 99),
  );
});

/** A single plan by key, or null. Cached per request. */
export const getPlanByKey = cache(
  async (key: string): Promise<PlatformPlan | null> => {
    const plans = await getActivePlans();
    return plans.find((p) => p.key === key) ?? null;
  },
);

/**
 * The user's current subscription row. Prefers an entitled (active/trialing)
 * subscription; otherwise returns the most recent row by period end so the
 * billing page can still surface a past_due / canceled state. Null if the
 * user has never had a subscription. Cached per request.
 */
export const getUserSubscription = cache(
  async (userId: string): Promise<PlatformSubscription | null> => {
    const subs = await db
      .select()
      .from(platformSubscriptions)
      .where(eq(platformSubscriptions.userId, userId));

    if (subs.length === 0) return null;

    const entitled = subs.filter((s) => ENTITLED_STATUSES.has(s.status));
    const pool = entitled.length > 0 ? entitled : subs;
    pool.sort(
      (a, b) =>
        (b.currentPeriodEnd?.getTime() ?? 0) -
        (a.currentPeriodEnd?.getTime() ?? 0),
    );
    return pool[0];
  },
);

/**
 * The plan the user is currently *entitled* to: the plan key of an
 * active/trialing subscription, or 'free' otherwise. This is the
 * entitlement answer — not "what they once signed up for". Cached per request.
 */
export const getUserPlan = cache(async (userId: string): Promise<PlanKey> => {
  const sub = await getUserSubscription(userId);
  if (sub && ENTITLED_STATUSES.has(sub.status)) {
    return sub.planKey as PlanKey;
  }
  return "free";
});

/**
 * The user's payment customer record for the active provider, or null if
 * they've never reached checkout. Used to decide whether to show the
 * billing-portal entry point. Cached per request.
 */
export const getUserPaymentCustomer = cache(
  async (userId: string): Promise<PlatformPaymentCustomer | null> => {
    const providerName = getProvider().name;
    const [customer] = await db
      .select()
      .from(platformPaymentCustomers)
      .where(
        and(
          eq(platformPaymentCustomers.userId, userId),
          eq(platformPaymentCustomers.provider, providerName),
        ),
      )
      .limit(1);
    return customer ?? null;
  },
);

/**
 * Server-only feature gate. Returns true when the user's currently-entitled
 * plan includes `featureKey` (per platform_plans.features). Never trusts a
 * client-supplied plan or feature claim — it derives entitlement from
 * subscription state in the DB.
 *
 * Cached per (userId, featureKey) per request, and the underlying plan +
 * subscription lookups are themselves cached, so calling this many times in
 * one render stays at two queries total — no N+1.
 */
export const canAccess = cache(
  async (userId: string, featureKey: string): Promise<boolean> => {
    const planKey = await getUserPlan(userId);
    const plan = await getPlanByKey(planKey);
    if (!plan) return false;
    const features = Array.isArray(plan.features)
      ? (plan.features as string[])
      : [];
    return features.includes(featureKey);
  },
);
