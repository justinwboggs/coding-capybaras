import { requireAdmin } from "@/platform/lib/auth";
import { requireJourneyComplete } from "@/platform/lib/journey/queries";

import { ConfigNav } from "./config-nav";

export const metadata = {
  title: "Configuration — Platform",
};

export default async function ConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gates every /config/* route. requireAdmin() redirects non-admins to
  // /dashboard (and unauthenticated users to /sign-in). requireJourneyComplete
  // additionally redirects users mid-journey to /journey — even admins should
  // finish the guided setup so platform_config has sane initial values.
  const admin = await requireAdmin();
  await requireJourneyComplete(admin.id);

  return (
    <section className="container max-w-4xl space-y-8 py-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground">
          Branding, pricing, email, and feature flags — configuration over
          code. Changes go live without a deploy.
        </p>
      </div>
      <ConfigNav />
      {children}
    </section>
  );
}
