"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { Form } from "@/platform/components/ui/form";
import {
  foundationStageRequiredSchema,
  type FoundationStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { SecurityIntro } from "./security-bits";
import { StageFormFooter } from "./stage-form-footer";

interface FoundationFormProps {
  // The signed-in user's email — concrete, server-derived proof that Supabase
  // auth is live (you can't reach this page without an authenticated session).
  userEmail: string;
}

// Stage 2 — Foundation (Supabase). CONFIRMATION step, not first-time setup.
//
// Onboarding now requires all four Supabase vars to be set BEFORE the app
// runs: the root middleware rewrites every route to /setup.html until they're
// present, and sign-in itself runs on Supabase auth + the root layout reads
// branding from the DB. So by the time a user reaches /journey/foundation,
// Supabase is NECESSARILY already connected — there's nothing to collect or
// instruct here. We confirm the connection and let them continue.
//
// We still persist the same attestation booleans the action expects (all
// necessarily true now), so stage-completion semantics are unchanged: the
// action sets confirmed=true on the continue intent. The platform still never
// collects secret values via web forms. See SECURITY_REDESIGN.md.
export function FoundationForm({ userEmail }: FoundationFormProps) {
  const [saving, startSaving] = useTransition();

  // The three confirmations are satisfied by definition once this page renders
  // — the app couldn't have booted or signed the user in otherwise. Default
  // them true so the unchanged strict schema validates on Continue without
  // asking the user to re-tick boxes for setup that's provably done.
  const form = useForm<FoundationStageInput>({
    resolver: zodResolver(foundationStageRequiredSchema),
    defaultValues: {
      createdProject: true,
      addedEnvVars: true,
      verifiedGitignore: true,
    },
  });

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "foundation",
        data: form.getValues(),
        intent: "save",
      });
      if (result && "error" in result) {
        toast.error("Couldn't save", { description: result.error });
        return;
      }
      toast.success("Progress saved");
    });
  }

  async function onContinue(values: FoundationStageInput) {
    const result = await saveStageAction({
      stage: "foundation",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <SecurityIntro />

      <Card>
        <CardHeader>
          <CardTitle>Supabase connected</CardTitle>
          <CardDescription>
            Supabase is your app&apos;s database (where your users and content live) and
            authentication (sign-in). You wired it up before starting the app — this is just a quick
            confirmation that it&apos;s working.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                Your database and auth backend are live.
              </p>
              <p className="text-muted-foreground">
                You&apos;re signed in as <strong>{userEmail}</strong>, and this page loaded straight
                from your Supabase database — so the connection is already working. (The app
                won&apos;t even start until all four Supabase values are set in your local{" "}
                <code>.env.local</code>, so you&apos;re already past that hurdle.)
              </p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Your Supabase keys live only in your local <code>.env.local</code> file — never on our
            servers. Need to point at a different Supabase project later? Edit{" "}
            <code>.env.local</code> and restart <code>pnpm dev</code>.
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onContinue)} noValidate>
              <StageFormFooter
                onSaveOnly={onSaveOnly}
                saving={saving}
                submitting={form.formState.isSubmitting}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
