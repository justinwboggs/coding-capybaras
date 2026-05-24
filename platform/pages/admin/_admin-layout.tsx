import { requireAdmin } from "@/platform/lib/auth";
import { requireJourneyComplete } from "@/platform/lib/journey/queries";

import { AdminNav } from "./admin-nav";

export const metadata = {
  title: "Admin — Platform",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gates every /admin/* route. Same posture as /config/*: admin-only +
  // requireJourneyComplete so even admins finish the guided setup before
  // managing customers (platform_config needs sane initial values, and an
  // admin who's mid-journey hasn't pasted their Stripe keys yet anyway).
  const admin = await requireAdmin();
  await requireJourneyComplete(admin.id);

  return (
    <section className="container max-w-6xl space-y-8 py-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage users, subscriptions, and the audit trail.
        </p>
      </div>
      <AdminNav />
      {children}
    </section>
  );
}
