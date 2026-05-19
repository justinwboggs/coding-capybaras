// Payment provider abstraction. Implementations live alongside this file
// (stripe.ts, bcpartners.ts). The Stripe SDK is imported in EXACTLY ONE
// place — stripe.ts — and never elsewhere in the codebase.

export type ProviderName = "stripe" | "bcpartners";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete";

export interface Customer {
  /** Internal id (platform_payment_customers.id) — set by callers, not the provider. */
  id?: string;
  externalId: string;
  provider: ProviderName;
  email: string;
  metadata: Record<string, unknown>;
}

export interface Subscription {
  id?: string;
  externalId: string;
  externalCustomerId: string;
  provider: ProviderName;
  status: SubscriptionStatus;
  planKey: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export type WebhookEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "payment.succeeded"
  | "payment.failed"
  | "customer.updated"
  // Fired when a one-time (mode='payment') Checkout session completes.
  // Carries metadata.user_id + metadata.plan_key set at session creation;
  // the handler upserts a lifetime row into platform_subscriptions.
  | "purchase.completed";

/**
 * Provider-agnostic webhook event. Providers normalize their native event
 * shapes into this. Carries the *external* IDs and price ID — the platform
 * handler maps externalPriceId → planKey via platform_plans.
 */
export interface NormalizedWebhookEvent {
  type: WebhookEventType;
  provider: ProviderName;
  /** Provider's customer ID (e.g. "cus_..."), not our internal UUID. */
  externalCustomerId: string;
  /** Provider's subscription ID (e.g. "sub_..."). Absent on customer.* events. */
  externalSubscriptionId?: string;
  /** Provider's price/plan ID for the subscription. Used to resolve planKey. */
  externalPriceId?: string;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  /** Optional context shipped along, e.g. customer email on customer.updated. */
  customerEmail?: string;
  /**
   * Provider-passed metadata. Currently used by `purchase.completed` to carry
   * `user_id` and `plan_key` from the Checkout session (set in
   * createCheckoutAction). Empty for events that don't carry metadata.
   */
  metadata?: Record<string, string>;
  /** The raw provider event for audit logging. Do NOT branch logic on this. */
  raw: unknown;
}

export interface CreateCheckoutSessionParams {
  externalCustomerId: string;
  externalPriceId: string;
  successUrl: string;
  cancelUrl: string;
  mode: "subscription" | "payment";
  metadata?: Record<string, string>;
}

export interface CreateBillingPortalParams {
  externalCustomerId: string;
  returnUrl: string;
}

export interface PaymentProvider {
  readonly name: ProviderName;

  // Customer ───────────────────────────────────────────────────────
  createCustomer(params: {
    email: string;
    userId: string;
    metadata?: Record<string, string>;
  }): Promise<Customer>;
  getCustomer(externalId: string): Promise<Customer | null>;

  // Checkout / billing portal ──────────────────────────────────────
  createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<{ url: string; sessionId: string }>;
  createBillingPortalSession(
    params: CreateBillingPortalParams,
  ): Promise<{ url: string }>;

  // Subscription ───────────────────────────────────────────────────
  getSubscription(externalId: string): Promise<Subscription | null>;
  cancelSubscription(
    externalId: string,
    opts?: { atPeriodEnd: boolean },
  ): Promise<Subscription>;

  // Webhooks ───────────────────────────────────────────────────────
  /**
   * Verify the signature and parse the event in one call.
   * Throws on invalid signature. Throws a tagged error (`code: "UNHANDLED_EVENT"`)
   * for signed-but-unsubscribed event types so the route can return 200.
   */
  parseAndVerifyWebhook(
    payload: string,
    signature: string,
    secret: string,
  ): NormalizedWebhookEvent;
}
