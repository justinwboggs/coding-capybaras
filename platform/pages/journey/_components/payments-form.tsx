"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { Form, FormField } from "@/platform/components/ui/form";
import { Label } from "@/platform/components/ui/label";
import { ENV_TEMPLATE_STRIPE } from "@/platform/lib/journey/env-templates";
import {
  paymentsStageRequiredSchema,
  type PaymentsStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { CopyableCodeBlock } from "./copyable-code-block";
import { SecurityCallout, SecurityIntro } from "./security-bits";
import { StageFormFooter } from "./stage-form-footer";

interface PaymentsFormProps {
  initial: {
    attestations?: PaymentsStageInput;
  };
}

// Stage 2 — Payments (Stripe). Instructions + 2 attestations. No Stripe
// secrets pass through our server; they live in the user's local .env.local.
export function PaymentsForm({ initial }: PaymentsFormProps) {
  const [saving, startSaving] = useTransition();
  const atts = initial.attestations ?? {};

  const form = useForm<PaymentsStageInput>({
    resolver: zodResolver(paymentsStageRequiredSchema),
    defaultValues: {
      createdAccount: atts.createdAccount ?? false,
      addedEnvVars: atts.addedEnvVars ?? false,
    },
  });

  const v = form.watch();
  const allChecked = Boolean(v.createdAccount && v.addedEnvVars);

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "payments",
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

  async function onContinue(values: PaymentsStageInput) {
    const result = await saveStageAction({
      stage: "payments",
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
          <CardTitle>Connect Stripe</CardTitle>
          <CardDescription>
            Stripe is how your app accepts payments. You&apos;ll set up <strong>test mode</strong>{" "}
            first — Stripe gives you fake card numbers to play with, no real money moves.
            You&apos;ll switch to live mode in the Deploy stage, once everything works end-to-end.
          </CardDescription>
          <a
            href="https://docs.stripe.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="block w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Watch a 2-minute setup walkthrough →
          </a>
        </CardHeader>
        <CardContent className="space-y-6">
          <SecurityCallout />

          <p className="text-sm text-muted-foreground">
            Same routine as your Supabase keys during install: your Stripe keys go into your local{" "}
            <code>.env.local</code>, never into this site.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onContinue)} className="space-y-6" noValidate>
              <section className="space-y-2">
                <h3 className="font-semibold">1. Create your Stripe account</h3>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>
                    Open{" "}
                    <a
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      dashboard.stripe.com
                    </a>{" "}
                    in a new tab. Sign up if you don&apos;t have an account yet, or sign in if you
                    do.
                  </li>
                  <li>
                    Look at the top-right of the Stripe dashboard — there&apos;s a toggle labeled{" "}
                    <strong>Test mode</strong>. Make sure it&apos;s <strong>on</strong> (you&apos;ll
                    see an orange glow). The keys you grab in the next step should start with{" "}
                    <code>sk_test_</code> or <code>pk_test_</code> — that&apos;s how you know
                    you&apos;re in test mode.
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  2. Add your three Stripe values to your local <code>.env.local</code> file
                </h3>
                <p className="text-sm text-muted-foreground">
                  Open <code>.env.local</code> in your editor (the same file you put your Supabase
                  keys in during install). Paste these three lines at the bottom:
                </p>
                <CopyableCodeBlock code={ENV_TEMPLATE_STRIPE} />
                <p className="text-sm text-muted-foreground">
                  Now go to your Stripe dashboard and replace each placeholder with its real value:
                </p>
                <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    In Stripe, go to <strong>Developers → API keys</strong> (left sidebar).
                    You&apos;ll find two values here:
                    <ul className="ml-5 mt-1 list-disc space-y-1">
                      <li>
                        <strong>Publishable key</strong> → paste into{" "}
                        <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours starts with</em> <code>pk_test_51</code>{" "}
                          <em>and runs about 100 characters</em>
                        </div>
                      </li>
                      <li>
                        <strong>Secret key</strong> → click <strong>Reveal test key</strong> to copy
                        it, then paste into <code>STRIPE_SECRET_KEY</code> (this one&apos;s the most
                        sensitive — keep it safe)
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours starts with</em> <code>sk_test_51</code>{" "}
                          <em>and runs about 100 characters</em>
                        </div>
                      </li>
                    </ul>
                  </li>
                  <li>
                    For <code>STRIPE_WEBHOOK_SECRET</code>: this is the code Stripe uses to tell
                    your app when a payment goes through. Two ways to handle it:
                    <ul className="ml-5 mt-1 list-disc space-y-1">
                      <li>
                        <strong>Easier (recommended for now):</strong> leave the placeholder as-is.
                        You&apos;ll wire this up properly in the Deploy stage, once your app is live
                        on the internet.
                      </li>
                      <li>
                        <strong>If you want to test webhooks locally now:</strong> install the{" "}
                        <a
                          href="https://docs.stripe.com/stripe-cli"
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2"
                        >
                          Stripe CLI
                        </a>{" "}
                        and run{" "}
                        <code>stripe listen --forward-to localhost:3000/api/webhooks/stripe</code>{" "}
                        in your editor&apos;s terminal. The CLI prints a <code>whsec_…</code> value
                        — paste that as your webhook secret.
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours will start with</em> <code>whsec_</code>{" "}
                          <em>and run about 40 characters</em>
                        </div>
                      </li>
                    </ul>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Save the file (<strong>Cmd+S</strong> on Mac, <strong>Ctrl+S</strong> on Windows).
                </p>
              </section>

              <Attestations form={form} />

              <StageFormFooter
                onSaveOnly={onSaveOnly}
                saving={saving}
                submitting={form.formState.isSubmitting}
                continueDisabled={!allChecked}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function Attestations({ form }: { form: ReturnType<typeof useForm<PaymentsStageInput>> }) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/40 p-4">
      <Label className="text-sm font-semibold">Confirm before continuing</Label>
      <div className="space-y-2">
        <FormField
          control={form.control}
          name="createdAccount"
          render={({ field }) => (
            <AttestationBox checked={Boolean(field.value)} onChange={field.onChange}>
              I&apos;ve signed into my Stripe account
            </AttestationBox>
          )}
        />
        <FormField
          control={form.control}
          name="addedEnvVars"
          render={({ field }) => (
            <AttestationBox checked={Boolean(field.value)} onChange={field.onChange}>
              I&apos;ve added my three Stripe values to my local <code>.env.local</code> file
            </AttestationBox>
          )}
        />
      </div>
    </section>
  );
}

function AttestationBox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3 transition-colors has-[input:checked]:border-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <span className="text-sm font-normal leading-snug">{children}</span>
    </Label>
  );
}
