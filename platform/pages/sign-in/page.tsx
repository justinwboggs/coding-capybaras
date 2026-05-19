import { type Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/platform/lib/auth";

import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in — Platform",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only honor same-origin relative paths — defends against open redirects.
  // /auth/callback re-validates the same way for the post-auth bounce.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  // Already signed in? Send them straight on (to `next` if we have one).
  const user = await getCurrentUser();
  if (user) redirect((safeNext ?? "/dashboard") as Route);

  return (
    <section className="container flex flex-col items-center py-24">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in or create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a magic link, or use Google.
          </p>
        </div>
        <SignInForm next={safeNext} />
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
