import { requireAuth } from "@/platform/lib/auth";
import { getUserPlan } from "@/platform/lib/billing";
import { getOrCreateJourney } from "@/platform/lib/journey/queries";

import { JourneySidebar } from "./_components/journey-sidebar";
import { ProgressHeader } from "./_components/progress-header";

export const metadata = {
  title: "Journey — Platform",
};

export default async function JourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The journey row materializes on first hit. Children can read it via
  // getOrCreateJourney (cached per request). Plan key drives the upgrade CTA
  // at the bottom of the sidebar — Free users see it, paid users don't.
  const user = await requireAuth();
  const [journey, planKey] = await Promise.all([
    getOrCreateJourney(user.id),
    getUserPlan(user.id),
  ]);

  return (
    <section className="container max-w-6xl space-y-6 py-8">
      <ProgressHeader journey={journey} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <JourneySidebar journey={journey} isFree={planKey === "free"} />
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
