"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";

// Error boundary for every route segment that doesn't ship its own
// error.tsx. Renders inside RootLayout (so brand tokens + font apply)
// but outside (authed) / (website) layouts — keep it standalone-safe.
//
// `reset()` re-renders the segment without a full reload — usually what
// you want for a transient render error. The "Go home" link is the
// escape hatch when the segment is genuinely broken.
//
// Production telemetry: when Sentry wiring lands, hook the captureException
// call here. The Sentry comment in platform/lib/payments/webhook-handler.ts
// has the same shape — keep them consistent so a single Sentry tranche
// can wire both at once.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
    // TODO(sentry): captureException(error) once Sentry is wired.
  }, [error]);

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An unexpected error stopped this page from rendering. You can try
            again, or head home and pick up from there.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
