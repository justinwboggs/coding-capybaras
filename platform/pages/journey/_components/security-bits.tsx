// Shared security UI primitives for the journey's instructional stages.
// Server-component-safe (no client hooks).

import { ShieldCheck } from "lucide-react";

/**
 * One-time "why we don't ask for your secrets" explainer, shown on Stage 2
 * (Foundation). Supabase is already connected by the time the user gets here,
 * so this sets the trust posture for the *upcoming* secret-key stages (Stripe
 * and Resend), which follow the same paste-into-your-own-.env.local pattern.
 */
export function SecurityIntro() {
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold leading-tight text-foreground">
            We&apos;ll never ask you to paste secret keys into this site.
          </h2>
          <p className="text-muted-foreground">
            The upcoming stages involve <em>secret keys</em> from Stripe and Resend — just like the
            Supabase keys you&apos;ve already set up. Think of them like the passwords to your bank
            account — they&apos;re powerful, and worth protecting. Most onboarding tools collect
            these through web forms. We don&apos;t. Your keys stay on your own computer, in a file
            called <code>.env.local</code>, and never touch our servers.
          </p>
          <p className="text-muted-foreground">
            Every step shows you exactly what to do and where to paste each value (on your computer,
            not here). Then you confirm you did it. That&apos;s the whole pattern — no secrets ever
            flow through us.
          </p>
          <p className="text-muted-foreground">
            <strong>Heads-up:</strong> those keys belong in the same local <code>.env.local</code>{" "}
            file your Supabase values are already in — and the boilerplate keeps that file out of
            Git (via <code>.gitignore</code>), so your secrets never get uploaded to the internet by
            accident.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Per-stage callout above the instructions. Reminds the user of the
 * `.gitignore` discipline and what to do if a key leaks.
 */
export function SecurityCallout() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex gap-2">
        <span className="text-base leading-none">🔒</span>
        <div className="space-y-1">
          <p className="font-semibold">Keep these keys private.</p>
          <p>
            Don&apos;t share them, don&apos;t paste them into web forms (including this one), and
            don&apos;t upload them to GitHub. Your keys belong in your local <code>.env.local</code>{" "}
            file only. If a key ever leaks, you can regenerate it in your provider&apos;s dashboard
            — it&apos;s a quick fix.
          </p>
        </div>
      </div>
    </div>
  );
}
