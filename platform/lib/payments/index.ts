import "server-only";

import { bcpartnersProvider } from "./bcpartners";
import { stripeProvider } from "./stripe";
import type { PaymentProvider, ProviderName } from "./types";

export type {
  Customer,
  CreateBillingPortalParams,
  CreateCheckoutSessionParams,
  NormalizedWebhookEvent,
  PaymentProvider,
  ProviderName,
  Subscription,
  SubscriptionStatus,
  WebhookEventType,
} from "./types";

export { handleNormalizedEvent } from "./webhook-handler";

const REGISTRY: Record<ProviderName, PaymentProvider> = {
  stripe: stripeProvider,
  bcpartners: bcpartnersProvider,
};

/**
 * Resolve a provider by name. With no name, falls back to the
 * PAYMENT_PROVIDER env var, then 'stripe' (V1 default).
 */
export function getProvider(name?: ProviderName): PaymentProvider {
  const resolved =
    name ??
    (process.env.PAYMENT_PROVIDER as ProviderName | undefined) ??
    "stripe";
  const provider = REGISTRY[resolved];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${resolved}`);
  }
  return provider;
}

/**
 * Look up the per-provider webhook secret from env. Centralized so the
 * generic [provider] route doesn't grow a switch statement.
 */
export function getWebhookSecret(name: ProviderName): string {
  const map: Record<ProviderName, string | undefined> = {
    stripe: process.env.STRIPE_WEBHOOK_SECRET,
    bcpartners: process.env.BCPARTNERS_WEBHOOK_SECRET,
  };
  const secret = map[name];
  if (!secret) {
    throw new Error(`Webhook secret for provider "${name}" is not set`);
  }
  return secret;
}
