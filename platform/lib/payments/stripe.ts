// ─────────────────────────────────────────────────────────────────
// THIS IS THE ONLY FILE IN THE CODEBASE THAT IMPORTS THE STRIPE SDK.
// All other code goes through the PaymentProvider abstraction in
// /lib/payments. See CLAUDE.md "Payments" section.
// ─────────────────────────────────────────────────────────────────
import "server-only";

import Stripe from "stripe";

import type {
  Customer,
  CreateBillingPortalParams,
  CreateCheckoutSessionParams,
  NormalizedWebhookEvent,
  PaymentProvider,
  Subscription,
  SubscriptionStatus,
  WebhookEventType,
} from "./types";

// Lazy-init: instantiating Stripe at module-load time forces STRIPE_SECRET_KEY
// to be present at bundle/cold-start time, which is fragile on serverless.
// Defer the env read until the first actual call so importing this module is
// always safe. Exported in case future tests / scripts need direct access.
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key, {
      // Use the SDK's pinned version; bump deliberately when upgrading.
      typescript: true,
    });
  }
  return _stripe;
}

// ── Mapping helpers ──────────────────────────────────────────────
function mapStripeStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
      return s;
    case "incomplete_expired":
    case "unpaid":
    case "paused":
      // Treat all "not currently paying us" states as past_due so canAccess()
      // can gate uniformly. Refine if/when we expose a richer state machine.
      return "past_due";
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

function toSubscription(sub: Stripe.Subscription): Subscription {
  const item = sub.items.data[0];
  const priceId = item?.price.id;
  if (!priceId) {
    throw new Error(`Stripe subscription ${sub.id} has no price item`);
  }
  return {
    externalId: sub.id,
    externalCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    provider: "stripe",
    status: mapStripeStatus(sub.status),
    // The platform handler will resolve this to a planKey via platform_plans.
    // We park the price ID here only so provider helpers stay self-contained.
    planKey: priceId,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

function toCustomer(c: Stripe.Customer | Stripe.DeletedCustomer): Customer {
  if ("deleted" in c && c.deleted) {
    return {
      externalId: c.id,
      provider: "stripe",
      email: "",
      metadata: {},
    };
  }
  const live = c as Stripe.Customer;
  return {
    externalId: live.id,
    provider: "stripe",
    email: live.email ?? "",
    metadata: (live.metadata ?? {}) as Record<string, unknown>,
  };
}

// ── Webhook event normalization ──────────────────────────────────
const STRIPE_TO_NORMALIZED: Record<string, WebhookEventType | undefined> = {
  "customer.subscription.created": "subscription.created",
  "customer.subscription.updated": "subscription.updated",
  "customer.subscription.deleted": "subscription.canceled",
  "invoice.payment_succeeded": "payment.succeeded",
  "invoice.payment_failed": "payment.failed",
  "customer.updated": "customer.updated",
  // One-time (mode='payment') checkout completions. Subscription-mode sessions
  // also fire this — but they're handled via customer.subscription.created, so
  // normalize() filters those out below.
  "checkout.session.completed": "purchase.completed",
};

function normalize(event: Stripe.Event): NormalizedWebhookEvent | null {
  const mapped = STRIPE_TO_NORMALIZED[event.type];
  if (!mapped) return null;

  if (mapped.startsWith("subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const item = sub.items.data[0];
    return {
      type: mapped,
      provider: "stripe",
      externalCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      externalSubscriptionId: sub.id,
      externalPriceId: item?.price.id,
      status:
        mapped === "subscription.canceled"
          ? "canceled"
          : mapStripeStatus(sub.status),
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      raw: event,
    };
  }

  if (mapped === "payment.succeeded" || mapped === "payment.failed") {
    const inv = event.data.object as Stripe.Invoice;
    return {
      type: mapped,
      provider: "stripe",
      externalCustomerId:
        typeof inv.customer === "string"
          ? inv.customer
          : (inv.customer?.id ?? ""),
      externalSubscriptionId:
        typeof inv.subscription === "string"
          ? inv.subscription
          : (inv.subscription?.id ?? undefined),
      raw: event,
    };
  }

  if (mapped === "purchase.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Only one-time payments here. Subscription-mode checkout completions are
    // already handled via customer.subscription.created — ignoring them here
    // avoids double-inserting platform_subscriptions rows.
    if (session.mode !== "payment") return null;

    // session.metadata may have null values; coerce to a clean string map.
    const metadata: Record<string, string> = {};
    for (const [k, v] of Object.entries(session.metadata ?? {})) {
      if (typeof v === "string") metadata[k] = v;
    }

    return {
      type: "purchase.completed",
      provider: "stripe",
      externalCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? ""),
      // The session ID is the idempotency key for the lifetime row in
      // platform_subscriptions. The composite (provider, external_id) index
      // makes webhook retries safe.
      externalSubscriptionId: session.id,
      metadata,
      raw: event,
    };
  }

  // customer.updated
  const cust = event.data.object as Stripe.Customer;
  return {
    type: "customer.updated",
    provider: "stripe",
    externalCustomerId: cust.id,
    customerEmail: cust.email ?? undefined,
    raw: event,
  };
}

// ── Provider implementation ──────────────────────────────────────
export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCustomer({ email, userId, metadata }) {
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email,
      metadata: { ...metadata, user_id: userId },
    });
    return toCustomer(customer);
  },

  async getCustomer(externalId) {
    const stripe = getStripeClient();
    try {
      const c = await stripe.customers.retrieve(externalId);
      return toCustomer(c);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) return null;
      throw err;
    }
  },

  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: params.mode,
      customer: params.externalCustomerId,
      line_items: [{ price: params.externalPriceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      // Surface the real customer-vs-card mismatch only after auth.
      allow_promotion_codes: true,
    });
    if (!session.url) {
      throw new Error("Stripe returned a checkout session without a URL");
    }
    return { url: session.url, sessionId: session.id };
  },

  async createBillingPortalSession({
    externalCustomerId,
    returnUrl,
  }: CreateBillingPortalParams) {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: externalCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },

  async getSubscription(externalId) {
    const stripe = getStripeClient();
    try {
      const sub = await stripe.subscriptions.retrieve(externalId);
      return toSubscription(sub);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) return null;
      throw err;
    }
  },

  async cancelSubscription(externalId, opts) {
    const stripe = getStripeClient();
    if (opts?.atPeriodEnd) {
      const sub = await stripe.subscriptions.update(externalId, {
        cancel_at_period_end: true,
      });
      return toSubscription(sub);
    }
    const sub = await stripe.subscriptions.cancel(externalId);
    return toSubscription(sub);
  },

  parseAndVerifyWebhook(payload, signature, secret) {
    const stripe = getStripeClient();
    // Throws Stripe.errors.StripeSignatureVerificationError on mismatch.
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    const normalized = normalize(event);
    if (!normalized) {
      // We received a real, signed Stripe event we don't currently care about.
      // Throw so the route can return 200 (acknowledged) with a known marker.
      const err = new Error(`Unhandled Stripe event type: ${event.type}`);
      (err as Error & { code?: string }).code = "UNHANDLED_EVENT";
      throw err;
    }
    return normalized;
  },
};
