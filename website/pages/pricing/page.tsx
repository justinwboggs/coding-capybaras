import Link from "next/link";
import { Check } from "lucide-react";

import { CheckoutButton } from "@/platform/components/marketing/checkout-button";
import { Badge } from "@/platform/components/ui/badge";
import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { getCurrentUser } from "@/platform/lib/auth";
import { getActivePlans, getUserPlan, type PlanKey } from "@/platform/lib/billing";
import { cn } from "@/platform/lib/utils";

export const metadata = {
  // Override via /config/pricing once you settle your positioning.
  title: "Pricing",
  description: "Simple, predictable plans. Start free, upgrade when you're ready.",
};

// Neutral defaults — override per tenant via /config/pricing once your
// positioning is settled. Same pattern as the landing-page tagline.
const PLAN_TAGLINES: Record<PlanKey, string> = {
  free: "Ship your first SaaS",
  pro: "Built for growing teams",
  business: "Scale on your terms",
};

// Marketing bullets. Distinct from platform_plans.features (which drives
// canAccess gating). These are positioning, not feature flags. Replace
// with copy that matches what your tenants actually use the boilerplate
// for.
const PLAN_BULLETS: Record<PlanKey, string[]> = {
  free: [
    "Auth, billing, and email wired up",
    "Configuration UI for branding and copy",
    "Audit log for every admin action",
  ],
  pro: [
    "Everything in Free",
    "Advanced branding (custom fonts, tokens, CSS)",
    "Priority support",
  ],
  business: [
    "Everything in Pro",
    "Custom contract and onboarding",
    "Dedicated implementation support",
  ],
};

/**
 * Render the price line for a plan. Three shapes:
 *  - mode='subscription' → "$X / per month"
 *  - mode='payment'      → "$X / one-time"
 *  - business            → "Contact" (handled outside this fn — see below)
 */
function formatPrice(plan: {
  amountCents: number;
  currency: string;
  interval: string;
  mode: string;
}): { amount: string; suffix: string } {
  if (plan.amountCents === 0) {
    return { amount: "$0", suffix: "free forever" };
  }
  const amount = (plan.amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    minimumFractionDigits: 0,
  });
  if (plan.mode === "payment") {
    return { amount, suffix: "one-time" };
  }
  return { amount, suffix: `per ${plan.interval}` };
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_error?: string }>;
}) {
  const [plans, user, { checkout_error }] = await Promise.all([
    getActivePlans(),
    getCurrentUser(),
    searchParams,
  ]);
  const currentPlan: PlanKey | null = user ? await getUserPlan(user.id) : null;

  return (
    <section className="container max-w-5xl py-20">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple pricing. Start free.
        </h1>
        <p className="text-lg text-muted-foreground">
          Three plans, no hidden fees. Upgrade when you outgrow Free; cancel
          any time from the customer portal.
        </p>
      </div>

      {/* Shown when /auth/callback's post-signin checkout intent fails — see
          the intent=checkout_pro path in platform/pages/auth/callback/route.ts. */}
      {checkout_error === "1" && (
        <div
          role="alert"
          className="mx-auto mt-10 max-w-2xl rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          We couldn&apos;t start checkout. Please try again, or contact us if
          the issue persists.
        </div>
      )}

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const planKey = plan.key as PlanKey;
          const isCurrent = currentPlan === planKey;
          const isPro = planKey === "pro";
          const isBusiness = planKey === "business";
          const bullets = PLAN_BULLETS[planKey] ?? [];

          return (
            <Card
              key={plan.key}
              className={cn(
                "flex flex-col",
                isPro && "border-primary shadow-md",
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  {isPro && <Badge>Most popular</Badge>}
                  {isCurrent && !isPro && (
                    <Badge variant="secondary">Current plan</Badge>
                  )}
                </div>

                {/* Price line — Business is "Contact for pricing", everyone else
                    gets a real number from the DB. */}
                {isBusiness ? (
                  <div className="text-2xl font-semibold tracking-tight">
                    Contact for pricing
                  </div>
                ) : (
                  <PriceLine
                    plan={{
                      amountCents: plan.amountCents,
                      currency: plan.currency,
                      interval: plan.interval,
                      mode: plan.mode,
                    }}
                    isPro={isPro}
                  />
                )}

                <CardDescription>{PLAN_TAGLINES[planKey] ?? ""}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <PlanCta
                  planKey={planKey}
                  isSignedIn={Boolean(user)}
                  isCurrent={isCurrent}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Prices in USD. Subscriptions renew monthly until canceled. Manage or
        cancel any time from your account billing page.
      </p>
    </section>
  );
}

function PriceLine({
  plan,
  isPro,
}: {
  plan: { amountCents: number; currency: string; interval: string; mode: string };
  isPro: boolean;
}) {
  const price = formatPrice(plan);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight">{price.amount}</span>
        <span className="text-sm text-muted-foreground">{price.suffix}</span>
      </div>
      {/* Optional positioning line under the Pro price — kept rendered
          for tenants who want a "was X, now Y" or "billed monthly" hint.
          Edit or delete to taste; numbers are display-only since the
          charged amount comes from the DB. */}
      {isPro && plan.amountCents > 0 && (
        <p className="text-xs text-muted-foreground">
          Cancel any time. No long-term contract.
        </p>
      )}
    </div>
  );
}

// CTA logic, kept in one place:
//  - free:      link to sign-in (or dashboard, if already signed in)
//  - pro:       signed-in → checkout action; signed-out → sign-in?next=/pricing
//  - business:  link to /business/contact (no Stripe involved)
function PlanCta({
  planKey,
  isSignedIn,
  isCurrent,
}: {
  planKey: PlanKey;
  isSignedIn: boolean;
  isCurrent: boolean;
}) {
  if (planKey === "free") {
    if (isCurrent) {
      return (
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      );
    }
    return (
      <Button asChild className="w-full">
        <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>Get started</Link>
      </Button>
    );
  }

  if (planKey === "business") {
    return (
      <Button asChild className="w-full">
        <Link href="/business/contact">Contact us</Link>
      </Button>
    );
  }

  // pro
  if (isCurrent) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/account/billing">Manage plan</Link>
      </Button>
    );
  }
  if (!isSignedIn) {
    // intent=checkout_pro lets /auth/callback trigger checkout straight after
    // sign-in, so the user doesn't have to click this CTA a second time.
    return (
      <Button asChild className="w-full">
        <Link href="/sign-in?next=/pricing&intent=checkout_pro">
          Get lifetime access
        </Link>
      </Button>
    );
  }
  return <CheckoutButton planKey="pro" label="Get lifetime access" />;
}
