"use client";

import { useTransition } from "react";
import { type Route } from "next";
import Link from "next/link";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";

import { saveStageAction } from "../actions";

import { CopyableCodeBlock } from "./copyable-code-block";
import { StageFormFooter } from "./stage-form-footer";

// Starter prompts the user copies into their AI assistant. Each is scoped to a
// single change, names the right region, and ends by asking the AI to run
// typecheck + lint and describe what changed. Kept as plain strings so they
// drop straight into CopyableCodeBlock.
const STARTER_PROMPTS: { title: string; prompt: string }[] = [
  {
    title: "Add a simple feature to your app",
    prompt:
      'Add a new page to my product called "Activity" that shows a simple ' +
      "list of recent items (use placeholder data for now — no database " +
      "changes yet). Create the route with the project's `pnpm new:route` " +
      "helper, keep every change inside the /product region, and follow the " +
      "existing component and routing patterns there. Don't touch /platform. " +
      "When you're done, run `pnpm typecheck` and `pnpm lint`, fix anything " +
      "they report, and tell me exactly which files you changed and why.",
  },
  {
    title: "Add a marketing page to your website",
    prompt:
      'Create a new marketing page at /about in the /website region. Match ' +
      "the look and structure of the existing marketing pages — reuse the " +
      "shared layout and the same UI components — and read the app name and " +
      "branding from the platform config instead of hardcoding them. Keep all " +
      "changes inside /website. When you're done, run `pnpm typecheck` and " +
      "`pnpm lint`, fix anything they flag, and summarize what you changed.",
  },
  {
    title: "Edit your copy and text",
    prompt:
      "Find the headline and subheading on my landing page in the /website " +
      "region and rewrite them to describe my product more clearly. Only " +
      "change the wording — don't change the layout, components, or anything " +
      "outside /website. After editing, run `pnpm typecheck` and `pnpm lint`, " +
      "then show me the before-and-after text and the file you changed.",
  },
];

export function TakeTheReinsForm({
  hasMarketplaceAccess,
  proPriceLabel,
}: {
  hasMarketplaceAccess: boolean;
  proPriceLabel: string;
}) {
  const [finishing, startFinishing] = useTransition();

  function onFinish(e: React.FormEvent) {
    e.preventDefault();
    startFinishing(async () => {
      const result = await saveStageAction({
        stage: "take-the-reins",
        data: {},
        intent: "continue",
      });
      if (result && "error" in result) {
        toast.error("Couldn't finish", { description: result.error });
      }
      // Success is a server-side redirect to /dashboard — nothing to do here.
    });
  }

  return (
    <form onSubmit={onFinish} className="space-y-6">
      {/* 1 — Calm send-off */}
      <Card>
        <CardHeader>
          <CardTitle>The app is yours now 🦫</CardTitle>
          <CardDescription>
            That&apos;s the whole setup — everything&apos;s wired up and ready.
            From here on, every change is yours to make. No need to rush: the
            capybara way is small steps, a calm pace, and letting your AI
            assistant do the heavy lifting. This last stop hands you the keys —
            how to change things safely, and a few prompts to put your AI to
            work in your own project right away.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2 — How to change things safely */}
      <Card>
        <CardHeader>
          <CardTitle>How to change things safely</CardTitle>
          <CardDescription>
            Your project is organized into three areas. Knowing which is which
            keeps your changes safe and your future updates smooth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">
              Your app — build here freely
            </p>
            <p className="text-muted-foreground">
              Everything behind sign-in that you&apos;re building lives in{" "}
              <code>/product</code> — dashboards, features, the actual thing
              your customers use. Change anything you like here.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Your marketing site — change it freely too
            </p>
            <p className="text-muted-foreground">
              Your public pages — landing, pricing, about — live in{" "}
              <code>/website</code>. Edit copy, add pages, restyle: all fair
              game.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              The engine room — best left alone
            </p>
            <p className="text-muted-foreground">
              Sign-in, billing, email, and payments — the plumbing that came
              already working — live in <code>/platform</code>. It updates
              itself when the boilerplate improves, so changes you make there
              can get overwritten the next time you pull an update. When in
              doubt, ask your AI to keep its changes out of{" "}
              <code>/platform</code>.
            </p>
          </div>
          <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
            Good news: your AI assistant already knows these rules — they&apos;re
            written down in the project&apos;s <code>CLAUDE.md</code> file. The
            prompts below point it to the right place automatically.
          </p>
        </CardContent>
      </Card>

      {/* 3 — Starter prompts (the value) */}
      <Card>
        <CardHeader>
          <CardTitle>Give your AI its first instruction</CardTitle>
          <CardDescription>
            Copy one of these into your AI assistant (Cursor, Claude Code, or
            whatever you use). Each is scoped to one small change, points at the
            right place, and asks your AI to check its work before it&apos;s
            done.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {STARTER_PROMPTS.map((p) => (
            <div key={p.title} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <CopyableCodeBlock code={p.prompt} label="Copy prompt" />
            </div>
          ))}

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">
              Want to change your colors, logo, app name, or fonts?
            </p>
            <p className="mt-1 text-muted-foreground">
              You don&apos;t need a prompt for that — open your{" "}
              <Link
                href={"/config/branding" as Route}
                className="text-primary underline underline-offset-2"
              >
                Branding settings
              </Link>{" "}
              and change them in a few clicks. It updates your whole site
              instantly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4 — Marketplace (value first, after the prompts) */}
      <Card>
        <CardHeader>
          <CardTitle>Need a head start with integrations?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {hasMarketplaceAccess ? (
            <p className="text-muted-foreground">
              You&apos;ve got full access — browse the marketplace for
              copy-paste integration guides and prompts for popular tools and
              services.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Want a head start? The marketplace has every integration guide and
              copy-paste prompt for your favorite apps and services — analytics,
              CRM, email, and more. {proPriceLabel} one-time, and it saves you
              hours of wiring things up yourself.
            </p>
          )}
          <a
            href="https://codingcapybaras.com/marketplace"
            target="_blank"
            rel="noreferrer"
            className="inline-block font-medium text-primary underline underline-offset-2"
          >
            {hasMarketplaceAccess
              ? "Browse the marketplace →"
              : "See what's in the marketplace →"}
          </a>
        </CardContent>
      </Card>

      <StageFormFooter
        saving={false}
        submitting={finishing}
        continueLabel="Finish & go to dashboard"
        hideSaveOnly
      />
    </form>
  );
}
