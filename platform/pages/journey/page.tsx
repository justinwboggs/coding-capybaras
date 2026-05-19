import { type Route } from "next";
import { redirect } from "next/navigation";

import { requireAuth } from "@/platform/lib/auth";
import { getOnboardingMode } from "@/platform/lib/config";
import { getOrCreateJourney, journeyLandingPath } from "@/platform/lib/journey/queries";

// /journey is a pure redirector — it materializes the journey row (if it's a
// brand-new user) and bounces to either the user's current stage or
// /dashboard (if they're already done). Stage pages live at /journey/[stage].
//
// In "skip" mode the journey UI is disabled entirely — bounce to /dashboard
// without materializing a row. The same gate also lives in
// _journey-layout.tsx (defense-in-depth for direct /journey/<stage> deep
// links); duplicating the check at the route entry documents intent at
// page.tsx so a reader doesn't have to chase up to the layout.
export default async function JourneyIndexPage() {
  if ((await getOnboardingMode()) === "skip") redirect("/dashboard");
  const user = await requireAuth();
  const journey = await getOrCreateJourney(user.id);
  redirect(journeyLandingPath(journey) as Route);
}
