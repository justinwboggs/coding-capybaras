import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { Button } from "@/platform/components/ui/button";
import { getBranding } from "@/platform/lib/config";

export default async function LandingPage() {
  // tagline comes from the journey's Branding stage; fall back to a
  // neutral default so a fresh deploy doesn't read as broken copy.
  // Override via /config/branding (admin) or the journey.
  const { appName, tagline } = await getBranding();
  const heroTagline = tagline || "Build faster. Charge smarter.";

  return (
    <>
      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {appName}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{heroTagline}</p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">Get started</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Auth + billing out of the box</CardTitle>
            <CardDescription>
              Sign-in, sign-up, sessions, Stripe checkout, subscriptions, and
              the customer portal — wired up before you write a line of
              product code.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configurable in the UI</CardTitle>
            <CardDescription>
              Branding, pricing, email templates, and feature flags edit live
              from <code>/config</code>. No redeploys to change a tagline or
              a plan price.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Built for your product</CardTitle>
            <CardDescription>
              The platform region stays out of your way. Build your features
              under <code>/product</code> and pull boilerplate updates
              without merge conflicts.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </>
  );
}
