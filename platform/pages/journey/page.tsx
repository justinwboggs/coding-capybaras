import { type Route } from "next";
import { redirect } from "next/navigation";

import { requireAuth } from "@/platform/lib/auth";
import { getOrCreateJourney, journeyLandingPath } from "@/platform/lib/journey/queries";

// /journey is a pure redirector — it materializes the journey row (if it's a
// brand-new user) and bounces to either the user's current stage or
// /dashboard (if they're already done). Stage pages live at /journey/[stage].
export default async function JourneyIndexPage() {
  const user = await requireAuth();
  const journey = await getOrCreateJourney(user.id);
  redirect(journeyLandingPath(journey) as Route);
}
