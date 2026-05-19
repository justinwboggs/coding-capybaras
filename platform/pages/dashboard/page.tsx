import { requireAuth } from "@/platform/lib/auth";
import { requireJourneyComplete } from "@/platform/lib/journey/queries";
import { Button } from "@/platform/components/ui/button";

import { signOutAction } from "./sign-out.action";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireAuth();
  await requireJourneyComplete(user.id); // redirects to /journey if not done

  return (
    <section className="container max-w-3xl space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {user.email}
        </h1>
        <p className="text-muted-foreground">
          This is where your product features live. Start building in{" "}
          <code>/product/</code>.
        </p>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </section>
  );
}
