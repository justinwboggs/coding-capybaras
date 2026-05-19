import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/platform/db/client";
import {
  platformAuditLog,
  platformPaymentCustomers,
  platformPlans,
  platformSubscriptions,
  platformUsers,
} from "@/platform/db/schema/platform";
import { sendEmail, type EmailTemplateKey } from "@/platform/lib/email";

import type { NormalizedWebhookEvent } from "./types";

/**
 * Outcome of handling a webhook event. The route handler turns this into
 * an HTTP response. We always return 2xx for "we got it, don't retry" —
 * including for events we deliberately ignore — and only fail loud for
 * errors that warrant Stripe redelivery.
 */
export type HandlerResult =
  | { ok: true; action: string }
  | { ok: false; reason: string; retry: boolean };

export async function handleNormalizedEvent(
  evt: NormalizedWebhookEvent,
): Promise<HandlerResult> {
  switch (evt.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
      return handleSubscriptionEvent(evt);
    case "payment.succeeded":
    case "payment.failed":
      return logPaymentEvent(evt);
    case "purchase.completed":
      return handlePurchaseEvent(evt);
    case "customer.updated":
      return logCustomerEvent(evt);
  }
}

// ── Subscription events ──────────────────────────────────────────
async function handleSubscriptionEvent(
  evt: NormalizedWebhookEvent,
): Promise<HandlerResult> {
  if (
    !evt.externalSubscriptionId ||
    !evt.externalPriceId ||
    !evt.status ||
    evt.cancelAtPeriodEnd === undefined
  ) {
    return {
      ok: false,
      reason: "subscription event missing required fields",
      retry: false,
    };
  }

  // 1. Resolve the price ID → internal plan key. platform_plans is the
  //    source of truth — Stripe's catalog is downstream of ours.
  const plans = await db.select().from(platformPlans);
  const plan = plans.find((p) => {
    const ids = (p.providerIds ?? {}) as Record<string, string>;
    return ids[evt.provider] === evt.externalPriceId;
  });

  if (!plan) {
    await writeAudit(evt, "webhook.unknown_price", {
      externalPriceId: evt.externalPriceId,
    });
    // Acknowledge so Stripe stops retrying. The audit row tells us to fix
    // platform_plans.provider_ids and (if needed) replay the event.
    return { ok: true, action: "acknowledged_unknown_price" };
  }

  // 2. Find the customer row. We never create it from a webhook —
  //    checkout-session creation is responsible for that. If missing,
  //    something upstream broke; log and acknowledge.
  const [customer] = await db
    .select()
    .from(platformPaymentCustomers)
    .where(
      and(
        eq(platformPaymentCustomers.provider, evt.provider),
        eq(platformPaymentCustomers.externalId, evt.externalCustomerId),
      ),
    )
    .limit(1);

  if (!customer) {
    await writeAudit(evt, "webhook.missing_customer", {
      externalCustomerId: evt.externalCustomerId,
    });
    return { ok: true, action: "acknowledged_missing_customer" };
  }

  // 3. Upsert the subscription. Composite unique on (provider, external_id)
  //    makes this idempotent under retries and concurrent delivery.
  await db
    .insert(platformSubscriptions)
    .values({
      userId: customer.userId,
      paymentCustomerId: customer.id,
      externalId: evt.externalSubscriptionId,
      provider: evt.provider,
      status: evt.status,
      planKey: plan.key,
      currentPeriodEnd: evt.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: evt.cancelAtPeriodEnd,
    })
    .onConflictDoUpdate({
      target: [
        platformSubscriptions.provider,
        platformSubscriptions.externalId,
      ],
      set: {
        status: evt.status,
        planKey: plan.key,
        currentPeriodEnd: evt.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: evt.cancelAtPeriodEnd,
      },
    });

  // Notify the user when their subscription is canceled. created/updated
  // don't get an email in V1 — checkout already gives the user feedback.
  if (evt.type === "subscription.canceled") {
    await notify(evt, "subscription_canceled");
  }

  return { ok: true, action: `subscription_${evt.type.split(".")[1]}` };
}

// ── One-time purchase events ─────────────────────────────────────
// Lifetime access is modeled as a row in platform_subscriptions with
// status='active' and current_period_end far in the future. Same gating logic
// (canAccess / getUserPlan) works without changes — see the Tranche 9 report
// for the design tradeoff vs. a separate platform_purchases table.
const LIFETIME_PERIOD_END = new Date("9999-12-31T23:59:59Z");

async function handlePurchaseEvent(
  evt: NormalizedWebhookEvent,
): Promise<HandlerResult> {
  if (!evt.externalSubscriptionId) {
    return {
      ok: false,
      reason: "purchase event missing session ID",
      retry: false,
    };
  }

  // metadata.plan_key is set by createCheckoutAction at session creation —
  // the server-side answer to "which plan was just bought."
  const planKey = evt.metadata?.plan_key;
  if (!planKey) {
    await writeAudit(evt, "webhook.purchase_missing_plan_key", {
      sessionId: evt.externalSubscriptionId,
    });
    return { ok: true, action: "acknowledged_missing_plan_key" };
  }

  // Resolve the plan. platform_plans is the source of truth.
  const [plan] = await db
    .select()
    .from(platformPlans)
    .where(eq(platformPlans.key, planKey))
    .limit(1);
  if (!plan) {
    await writeAudit(evt, "webhook.purchase_unknown_plan", { planKey });
    return { ok: true, action: "acknowledged_unknown_plan" };
  }

  // Find the customer row. Checkout-session creation is responsible for
  // creating it; if missing, something upstream broke — log and acknowledge.
  const [customer] = await db
    .select()
    .from(platformPaymentCustomers)
    .where(
      and(
        eq(platformPaymentCustomers.provider, evt.provider),
        eq(platformPaymentCustomers.externalId, evt.externalCustomerId),
      ),
    )
    .limit(1);
  if (!customer) {
    await writeAudit(evt, "webhook.missing_customer", {
      externalCustomerId: evt.externalCustomerId,
    });
    return { ok: true, action: "acknowledged_missing_customer" };
  }

  // Upsert the lifetime subscription row. Composite unique on
  // (provider, external_id) makes this idempotent under webhook retries.
  await db
    .insert(platformSubscriptions)
    .values({
      userId: customer.userId,
      paymentCustomerId: customer.id,
      externalId: evt.externalSubscriptionId,
      provider: evt.provider,
      status: "active",
      planKey: plan.key,
      currentPeriodEnd: LIFETIME_PERIOD_END,
      cancelAtPeriodEnd: false,
    })
    .onConflictDoUpdate({
      target: [
        platformSubscriptions.provider,
        platformSubscriptions.externalId,
      ],
      set: {
        status: "active",
        planKey: plan.key,
        currentPeriodEnd: LIFETIME_PERIOD_END,
        cancelAtPeriodEnd: false,
      },
    });

  await writeAudit(evt, "webhook.purchase.completed", {
    planKey: plan.key,
    sessionId: evt.externalSubscriptionId,
  });

  // Same confirmation template as a recurring payment — Stripe never fires
  // invoice.payment_succeeded for one-time purchases, so this is the send site.
  await notify(evt, "payment_succeeded");

  return { ok: true, action: "purchase_completed" };
}

// ── Payment events ───────────────────────────────────────────────
async function logPaymentEvent(
  evt: NormalizedWebhookEvent,
): Promise<HandlerResult> {
  await writeAudit(evt, `webhook.${evt.type}`, {
    externalCustomerId: evt.externalCustomerId,
    externalSubscriptionId: evt.externalSubscriptionId,
  });
  await notify(
    evt,
    evt.type === "payment.succeeded" ? "payment_succeeded" : "payment_failed",
  );
  return { ok: true, action: evt.type };
}

// ── Customer events ──────────────────────────────────────────────
async function logCustomerEvent(
  evt: NormalizedWebhookEvent,
): Promise<HandlerResult> {
  await writeAudit(evt, "webhook.customer.updated", {
    externalCustomerId: evt.externalCustomerId,
    customerEmail: evt.customerEmail,
  });
  return { ok: true, action: "customer_updated" };
}

// ── Email notification helpers ───────────────────────────────────
/**
 * Resolve the user's email + current plan name for a webhook event, via the
 * customer mapping. Returns null when we can't trace the event back to a user
 * (e.g. a webhook arrived before checkout persisted the customer row).
 */
async function resolveRecipient(
  evt: NormalizedWebhookEvent,
): Promise<{ email: string; planDisplayName: string } | null> {
  const [customer] = await db
    .select({ userId: platformPaymentCustomers.userId })
    .from(platformPaymentCustomers)
    .where(
      and(
        eq(platformPaymentCustomers.provider, evt.provider),
        eq(platformPaymentCustomers.externalId, evt.externalCustomerId),
      ),
    )
    .limit(1);
  if (!customer) return null;

  const [user] = await db
    .select({ email: platformUsers.email })
    .from(platformUsers)
    .where(eq(platformUsers.id, customer.userId))
    .limit(1);
  if (!user) return null;

  // Plan name is best-effort — fall back to a generic phrase if the
  // subscription or plan can't be resolved.
  let planDisplayName = "your plan";
  if (evt.externalSubscriptionId) {
    const [sub] = await db
      .select({ planKey: platformSubscriptions.planKey })
      .from(platformSubscriptions)
      .where(
        and(
          eq(platformSubscriptions.provider, evt.provider),
          eq(platformSubscriptions.externalId, evt.externalSubscriptionId),
        ),
      )
      .limit(1);
    if (sub) {
      const [plan] = await db
        .select({ displayName: platformPlans.displayName })
        .from(platformPlans)
        .where(eq(platformPlans.key, sub.planKey))
        .limit(1);
      if (plan) planDisplayName = plan.displayName;
    }
  }

  return { email: user.email, planDisplayName };
}

/**
 * Send a transactional email for a webhook event. Wrapped so an email failure
 * can never block webhook processing — sendEmail() already swallows its own
 * errors and logs to platform_email_log; this try/catch is belt-and-suspenders.
 */
async function notify(
  evt: NormalizedWebhookEvent,
  templateKey: EmailTemplateKey,
): Promise<void> {
  try {
    const recipient = await resolveRecipient(evt);
    if (!recipient) {
      console.warn(
        `[webhook] ${evt.type}: could not resolve a recipient — email skipped`,
      );
      return;
    }
    await sendEmail({
      to: recipient.email,
      templateKey,
      data: {
        user: { email: recipient.email },
        plan: { display_name: recipient.planDisplayName },
      },
    });
  } catch (err) {
    console.error(`[webhook] email for ${evt.type} failed`, err);
  }
}

// ── Audit-log helper ─────────────────────────────────────────────
async function writeAudit(
  evt: NormalizedWebhookEvent,
  action: string,
  metadata: Record<string, unknown>,
) {
  // Look up our internal user via the customer mapping — best-effort.
  let userId: string | null = null;
  const [customer] = await db
    .select({ userId: platformPaymentCustomers.userId })
    .from(platformPaymentCustomers)
    .where(
      and(
        eq(platformPaymentCustomers.provider, evt.provider),
        eq(platformPaymentCustomers.externalId, evt.externalCustomerId),
      ),
    )
    .limit(1);
  if (customer) userId = customer.userId;

  await db.insert(platformAuditLog).values({
    userId,
    action,
    resourceType: "webhook",
    resourceId: evt.externalSubscriptionId ?? evt.externalCustomerId,
    metadata: { provider: evt.provider, ...metadata },
  });
}
