import {
  getBranding,
  getOnboardingInitialRedirect,
} from "@/platform/lib/config";

import { BrandingForm } from "./branding-form";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Branding — Configuration" };

// Two cards stacked. Branding owns appName / colors / logo; Onboarding owns
// the single redirect-mode setting. Independent forms with independent save
// buttons + audit actions — collocated here because they share the same
// admin surface but are otherwise unrelated concerns.
export default async function BrandingConfigPage() {
  const [branding, initialRedirect] = await Promise.all([
    getBranding(),
    getOnboardingInitialRedirect(),
  ]);

  return (
    <div className="space-y-6">
      <BrandingForm initial={branding} />
      <OnboardingForm initial={{ initialRedirect }} />
    </div>
  );
}
