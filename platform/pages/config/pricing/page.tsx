import { getActivePlans } from "@/platform/lib/billing";

import { PricingForm } from "./pricing-form";

export const metadata = { title: "Pricing — Configuration" };

export default async function PricingConfigPage() {
  const plans = await getActivePlans();

  const initialPlans = plans.map((p) => ({
    key: p.key as "free" | "pro" | "business",
    displayName: p.displayName,
    amountDollars: p.amountCents / 100,
    interval: (p.interval === "year" ? "year" : "month") as "month" | "year",
    featuresText: (Array.isArray(p.features) ? (p.features as string[]) : [])
      .join("\n"),
  }));

  return <PricingForm initialPlans={initialPlans} />;
}
