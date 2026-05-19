import { z } from "zod";

// Plans that can actually be checked out. 'free' is excluded — it has no
// provider price and is the default state, not a purchase. Used to validate
// the (untrusted) plan key a client passes into createCheckoutAction.
export const checkoutPlanSchema = z.enum(["pro", "business"]);
export type CheckoutPlan = z.infer<typeof checkoutPlanSchema>;
