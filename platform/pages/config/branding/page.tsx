import {
  getBranding,
  getMetaDescription,
  getOnboardingInitialRedirect,
  getOnboardingMode,
} from "@/platform/lib/config";

import { BrandingForm } from "./branding-form";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Branding — Configuration" };

// Two cards stacked. Branding owns appName / colors / logo / meta description;
// Onboarding owns the journey gate (mode) and the incomplete-journey redirect
// destination (initialRedirect). Independent forms with independent save
// buttons + audit actions — collocated here because they share the same
// admin surface but are otherwise unrelated concerns.
export default async function BrandingConfigPage() {
  const [branding, metaDescription, mode, initialRedirect] = await Promise.all([
    getBranding(),
    getMetaDescription(),
    getOnboardingMode(),
    getOnboardingInitialRedirect(),
  ]);

  return (
    <div className="space-y-6">
      <BrandingForm
        initial={{ ...branding, metaDescription: metaDescription ?? "" }}
      />
      <OnboardingForm initial={{ mode, initialRedirect }} />
    </div>
  );
}
