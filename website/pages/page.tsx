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
  const { appName } = await getBranding();

  return (
    <>
      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {appName}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {/* COPY_TODO: one-line description of what your SaaS does. */}
          COPY_TODO: one-line description of what your SaaS does.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">Get started</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        <Card>
          <CardHeader>
            {/* COPY_TODO: first feature headline + supporting line. */}
            <CardTitle>COPY_TODO: feature one</CardTitle>
            <CardDescription>
              COPY_TODO: one or two sentences describing this feature.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            {/* COPY_TODO: second feature headline + supporting line. */}
            <CardTitle>COPY_TODO: feature two</CardTitle>
            <CardDescription>
              COPY_TODO: one or two sentences describing this feature.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            {/* COPY_TODO: third feature headline + supporting line. */}
            <CardTitle>COPY_TODO: feature three</CardTitle>
            <CardDescription>
              COPY_TODO: one or two sentences describing this feature.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </>
  );
}
