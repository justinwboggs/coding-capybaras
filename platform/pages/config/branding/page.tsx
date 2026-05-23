import {
  getBrandingExtended,
  getOnboardingInitialRedirect,
  getOnboardingMode,
} from "@/platform/lib/config";
import { getTier } from "@/platform/lib/tier";

import { BrandingForm } from "./branding-form";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Branding — Configuration" };

// Two cards stacked. Branding owns appName / colors / logo / theme tokens /
// (Pro-gated) advanced overrides; Onboarding owns the journey gate (mode)
// and the incomplete-journey redirect destination (initialRedirect).
// Independent forms with independent save buttons + audit actions —
// collocated here because they share the same admin surface but are
// otherwise unrelated concerns.
export default async function BrandingConfigPage() {
  const [branding, mode, initialRedirect] = await Promise.all([
    getBrandingExtended(),
    getOnboardingMode(),
    getOnboardingInitialRedirect(),
  ]);
  // Tier is env-derived — read server-side and threaded down as a prop so
  // the client form can render the locked-but-visible L3 section.
  const tier = getTier();

  return (
    <div className="space-y-6">
      <BrandingForm initial={branding} tier={tier} />
      <OnboardingForm initial={{ mode, initialRedirect }} />
    </div>
  );
}
