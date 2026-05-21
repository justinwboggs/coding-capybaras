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
  // COPY_TODO: pricing page title + description for SEO/social cards.
  title: "Pricing",
  description: "COPY_TODO: short description of your pricing.",
};

// COPY_TODO: write your own positioning line for each plan.
const PLAN_TAGLINES: Record<PlanKey, string> = {
  free: "COPY_TODO: positioning line for the free plan.",
  pro: "COPY_TODO: positioning line for the pro plan.",
  business: "COPY_TODO: positioning line for the business plan.",
};

// COPY_TODO: marketing bullets for each plan. Distinct from platform_plans.features
// (which drives the canAccess gating list). These are positioning, not feature flags.
const PLAN_BULLETS: Record<PlanKey, string[]> = {
  free: [
    "COPY_TODO: free bullet one",
    "COPY_TODO: free bullet two",
    "COPY_TODO: free bullet three",
  ],
  pro: [
    "COPY_TODO: pro bullet one",
    "COPY_TODO: pro bullet two",
    "COPY_TODO: pro bullet three",
  ],
  business: [
    "COPY_TODO: business bullet one",
    "COPY_TODO: business bullet two",
    "COPY_TODO: business bullet three",
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
          {/* COPY_TODO: pricing page headline. */}
          COPY_TODO: pricing headline
        </h1>
        <p className="text-lg text-muted-foreground">
          {/* COPY_TODO: pricing page subheadline. */}
          COPY_TODO: short paragraph framing your pricing.
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
                  {/* COPY_TODO: badge label on the highlighted plan, if any. */}
                  {isPro && <Badge>COPY_TODO: badge</Badge>}
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
        {/* COPY_TODO: footnote — currency, refund policy, anything else. */}
        COPY_TODO: pricing footnote.
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
      {/* COPY_TODO: optional "was X, now Y" line under the Pro price.
          Numbers are display-only — the charged amount comes from the DB. */}
      {isPro && plan.amountCents > 0 && (
        <p className="text-xs text-muted-foreground">
          COPY_TODO: optional positioning line under the price
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
