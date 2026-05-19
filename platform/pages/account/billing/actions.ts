"use server";

import { type Route } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/platform/db/client";
import { platformPaymentCustomers, platformPlans } from "@/platform/db/schema/platform";
import { requireAuth } from "@/platform/lib/auth";
import { getUserPaymentCustomer } from "@/platform/lib/billing";
import { getProvider } from "@/platform/lib/payments";
import { checkoutPlanSchema } from "@/platform/lib/validation/billing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Server actions return this on the error path; the success path redirects,
// so callers only ever observe `{ error }`. Mirrors the toast pattern the
// sign-in form uses.
type ActionError = { error: string };

/**
 * Start a Checkout session for a paid plan and redirect the user to it.
 * Gets-or-creates the user's payment customer first. The provider price ID
 * comes from platform_plans.provider_ids — never hardcoded (CLAUDE.md §4).
 *
 * `planKey` arrives from the client and is therefore untrusted — it's
 * Zod-validated before use.
 */
export async function createCheckoutAction(
  planKey: unknown,
): Promise<ActionError | undefined> {
  const user = await requireAuth();

  const parsed = checkoutPlanSchema.safeParse(planKey);
  if (!parsed.success) {
    return { error: "That plan can't be purchased." };
  }
  const plan = parsed.data;

  let checkoutUrl: string;
  try {
    const provider = getProvider();

    // Resolve the plan + its provider price ID. DB is the source of truth.
    const [planRow] = await db
      .select()
      .from(platformPlans)
      .where(eq(platformPlans.key, plan))
      .limit(1);
    if (!planRow) {
      return { error: "That plan no longer exists." };
    }

    const providerIds = (planRow.providerIds ?? {}) as Record<string, string>;
    const priceId = providerIds[provider.name];
    if (!priceId) {
      // platform_plans.provider_ids hasn't been populated for this provider.
      // See the tranche report for the one-time SQL step that fixes this.
      return { error: "This plan isn't available for checkout yet." };
    }

    // Get-or-create the provider customer, persisted in platform_payment_customers.
    let customer = await getUserPaymentCustomer(user.id);
    if (!customer) {
      const created = await provider.createCustomer({
        email: user.email,
        userId: user.id,
      });
      const [inserted] = await db
        .insert(platformPaymentCustomers)
        .values({
          userId: user.id,
          externalId: created.externalId,
          provider: provider.name,
        })
        .returning();
      customer = inserted;
    }

    const session = await provider.createCheckoutSession({
      externalCustomerId: customer.externalId,
      externalPriceId: priceId,
      successUrl: `${APP_URL}/account/billing?checkout=success`,
      cancelUrl: `${APP_URL}/pricing?checkout=canceled`,
      // Checkout mode comes from platform_plans.mode — 'subscription' for
      // recurring plans, 'payment' for one-time purchases like the Tranche 9
      // Pro lifetime offer. Defensive fallback for older rows.
      mode: planRow.mode === "payment" ? "payment" : "subscription",
      metadata: { user_id: user.id, plan_key: plan },
    });
    checkoutUrl = session.url;
  } catch (err) {
    // Sentry hookup comes later in the build plan; console.error surfaces in
    // `vercel logs` / local dev for now.
    console.error("[billing] createCheckoutAction failed", err);
    return { error: "Couldn't start checkout. Please try again." };
  }

  // redirect() throws NEXT_REDIRECT — it MUST run outside the try/catch, or
  // the catch swallows it and reports a false error. The `as Route` cast is
  // the documented escape hatch for typedRoutes: this is an external provider
  // URL, not an app route.
  redirect(checkoutUrl as Route);
}

/**
 * Open the provider's billing portal for the current user and redirect to it.
 * Requires an existing payment customer — the billing page only renders the
 * entry point when getUserPaymentCustomer() is non-null, but we re-check here.
 */
export async function openBillingPortalAction(): Promise<
  ActionError | undefined
> {
  const user = await requireAuth();

  let portalUrl: string;
  try {
    const customer = await getUserPaymentCustomer(user.id);
    if (!customer) {
      return { error: "No billing account yet — start a plan first." };
    }

    const provider = getProvider();
    const session = await provider.createBillingPortalSession({
      externalCustomerId: customer.externalId,
      returnUrl: `${APP_URL}/account/billing`,
    });
    portalUrl = session.url;
  } catch (err) {
    console.error("[billing] openBillingPortalAction failed", err);
    return { error: "Couldn't open the billing portal. Please try again." };
  }

  // Outside the try/catch — see note in createCheckoutAction. External
  // provider URL, hence the `as Route` cast for typedRoutes.
  redirect(portalUrl as Route);
}
