import { FEATURE_REGISTRY, getActivePlans } from "@/platform/lib/billing";

import { FeatureFlagsForm } from "./feature-flags-form";

export const metadata = { title: "Feature Flags — Configuration" };

export default async function FeatureFlagsConfigPage() {
  const plans = await getActivePlans();

  const planFeatures: Record<string, string[]> = {};
  for (const p of plans) {
    planFeatures[p.key] = Array.isArray(p.features)
      ? (p.features as string[])
      : [];
  }

  return (
    <FeatureFlagsForm
      features={FEATURE_REGISTRY}
      initial={{
        free: planFeatures.free ?? [],
        pro: planFeatures.pro ?? [],
        business: planFeatures.business ?? [],
      }}
    />
  );
}
