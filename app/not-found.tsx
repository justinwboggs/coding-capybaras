import Link from "next/link";

import { Button } from "@/platform/components/ui/button";

// 404 page for unmatched routes across the entire app. Rendered inside
// RootLayout, but outside (authed) / (website) layouts — keep it
// standalone so it works whether the user is signed in or not.
// Server component (no auth check here on purpose: a 404 should be a
// 404 regardless of session state, and adding auth would create a
// confusing flicker on broken authed-route links).
export const metadata = { title: "Page not found" };

export default function NotFoundPage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, has moved, or
          isn&apos;t something you have access to.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
