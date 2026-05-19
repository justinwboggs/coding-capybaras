import Link from "next/link";

import { Badge } from "@/platform/components/ui/badge";
import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { requireAuth } from "@/platform/lib/auth";
import {
  getPlanByKey,
  getUserPaymentCustomer,
  getUserPlan,
  getUserSubscription,
} from "@/platform/lib/billing";
import { getJourney } from "@/platform/lib/journey/queries";

import { ManageBillingButton } from "./manage-billing-button";

export const metadata = {
  title: "Billing — Platform",
};

// Normalized subscription statuses → how we describe them to the user.
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
};

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireAuth();
  // Intentionally NOT calling requireJourneyComplete here — users mid-journey
  // must be able to view billing and upgrade. Without this exception, a Free
  // user who decides partway through that they want Pro for the marketplace
  // has no path to checkout. We show a "Return to journey" CTA instead.
  const { checkout } = await searchParams;

  const [planKey, subscription, paymentCustomer, journey] = await Promise.all([
    getUserPlan(user.id),
    getUserSubscription(user.id),
    getUserPaymentCustomer(user.id),
    getJourney(user.id),
  ]);
  const plan = await getPlanByKey(planKey);

  const planName = plan?.displayName ?? "Free";
  const isFree = planKey === "free";
  const periodEnd = formatDate(subscription?.currentPeriodEnd ?? null);
  const journeyIncomplete = !journey || journey.completedAt === null;

  return (
    <section className="container max-w-2xl space-y-6 py-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your plan and payment details.
        </p>
      </div>

      {checkout === "success" && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Checkout complete — thank you. Your plan updates here within a few
          moments once the payment confirmation lands.
        </div>
      )}

      {journeyIncomplete && (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <span>
            You&apos;re still mid-journey. Come back here anytime —{" "}
            <span className="text-muted-foreground">your journey progress is saved.</span>
          </span>
          <Button asChild size="sm">
            <Link href="/journey">Return to your journey →</Link>
          </Button>
        </div>
      )}

      {/* Current plan ----------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your plan</CardTitle>
            <Badge variant={isFree ? "secondary" : "default"}>{planName}</Badge>
          </div>
          <CardDescription>
            {isFree
              ? "You're on the free plan — complete, and free forever."
              : "Thanks for being a paying customer."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && !isFree && (
            <dl className="grid gap-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </dd>
              </div>
              {periodEnd && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {subscription.cancelAtPeriodEnd
                      ? "Access until"
                      : "Renews on"}
                  </dt>
                  <dd>{periodEnd}</dd>
                </div>
              )}
            </dl>
          )}

          {/* Free now, but a prior subscription exists — surface its state. */}
          {subscription && isFree && (
            <p className="text-sm text-muted-foreground">
              Your last subscription is{" "}
              {(
                STATUS_LABELS[subscription.status] ?? subscription.status
              ).toLowerCase()}
              . Re-subscribe anytime from the pricing page.
            </p>
          )}

          {isFree && (
            <Button asChild>
              <Link href="/pricing">Upgrade →</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment & invoices ----------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Payment &amp; invoices</CardTitle>
          <CardDescription>
            {paymentCustomer
              ? "Update your card, switch plans, or download invoices in the billing portal."
              : "Once you start a paid plan, manage payment details here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentCustomer ? (
            <>
              <ManageBillingButton />
              {/* Invoice-list rendering is deferred to V1.5 — for now we point
                  at the provider's portal, which already has full history. */}
              <p className="text-sm text-muted-foreground">
                Billing history —{" "}
                <ManageBillingButton
                  variant="link"
                  label="view past invoices in the billing portal"
                  className="h-auto p-0 text-sm font-normal"
                />
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No billing history yet.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
