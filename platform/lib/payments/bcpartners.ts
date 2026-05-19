import "server-only";

import type { PaymentProvider } from "./types";

// V1 stub. Exists so the abstraction is visible — every method throws
// so any accidental wiring fails loudly. Replace with a real implementation
// in V2 when BCPartners onboarding is live.
function nope(method: string): never {
  throw new Error(
    `BCPartners provider is not implemented yet (called ${method}). ` +
      `Set PAYMENT_PROVIDER=stripe until V2 ships.`,
  );
}

export const bcpartnersProvider: PaymentProvider = {
  name: "bcpartners",
  createCustomer: () => nope("createCustomer"),
  getCustomer: () => nope("getCustomer"),
  createCheckoutSession: () => nope("createCheckoutSession"),
  createBillingPortalSession: () => nope("createBillingPortalSession"),
  getSubscription: () => nope("getSubscription"),
  cancelSubscription: () => nope("cancelSubscription"),
  parseAndVerifyWebhook: () => nope("parseAndVerifyWebhook"),
};
