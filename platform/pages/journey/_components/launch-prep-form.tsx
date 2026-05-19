"use client";

import { useTransition } from "react";
import Link from "next/link";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Input } from "@/platform/components/ui/input";
import { Label } from "@/platform/components/ui/label";
import { Textarea } from "@/platform/components/ui/textarea";
import {
  launchPrepStageRequiredSchema,
  type LaunchPrepStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { StageFormFooter } from "./stage-form-footer";

const REFUND_POLICIES = [
  {
    value: "30-day-no-questions",
    label: "30-day, no questions asked",
    description:
      "Most permissive. Highest conversion, slightly higher refund rate.",
  },
  {
    value: "case-by-case",
    label: "Case-by-case",
    description:
      "Default for V1. Honest middle ground — write the policy in plain English on /terms.",
  },
  {
    value: "no-refunds",
    label: "No refunds",
    description:
      "Use sparingly. Acceptable for one-time low-ticket; risky for subscriptions.",
  },
] as const;

export function LaunchPrepForm({
  initial,
}: {
  initial: LaunchPrepStageInput;
}) {
  const [saving, startSaving] = useTransition();
  const form = useForm<LaunchPrepStageInput>({
    resolver: zodResolver(launchPrepStageRequiredSchema),
    defaultValues: {
      termsAccepted: initial.termsAccepted ?? false,
      privacyAccepted: initial.privacyAccepted ?? false,
      refundPolicy: initial.refundPolicy ?? "",
      customDomain: initial.customDomain ?? "",
      seoDescription: initial.seoDescription ?? "",
      ogImageUrl: initial.ogImageUrl ?? "",
    },
  });

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "launch-prep",
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

  async function onContinue(values: LaunchPrepStageInput) {
    const result = await saveStageAction({
      stage: "launch-prep",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Launch prep</CardTitle>
        <CardDescription>
          Quick legal + ops checklist before you flip the live switch. Default
          legal pages live at <Link href="/terms" className="underline underline-offset-2">/terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            /privacy
          </Link>{" "}
          — review and replace the placeholders before launch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onContinue)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem>
                  <Label className="flex items-start gap-3 rounded-md border p-3 has-[input:checked]:border-primary">
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">
                      <span className="font-medium">
                        I&apos;ve reviewed Terms of Service{" "}
                        <span className="text-destructive">*</span>
                      </span>
                      <br />
                      <span className="text-muted-foreground">
                        Visit{" "}
                        <Link
                          href="/terms"
                          className="underline underline-offset-2"
                        >
                          /terms
                        </Link>
                        . Replace the placeholder before public launch.
                      </span>
                    </span>
                  </Label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyAccepted"
              render={({ field }) => (
                <FormItem>
                  <Label className="flex items-start gap-3 rounded-md border p-3 has-[input:checked]:border-primary">
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">
                      <span className="font-medium">
                        I&apos;ve reviewed Privacy Policy{" "}
                        <span className="text-destructive">*</span>
                      </span>
                      <br />
                      <span className="text-muted-foreground">
                        Visit{" "}
                        <Link
                          href="/privacy"
                          className="underline underline-offset-2"
                        >
                          /privacy
                        </Link>
                        . Replace the placeholder before public launch.
                      </span>
                    </span>
                  </Label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refundPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Refund policy <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="space-y-2">
                    {REFUND_POLICIES.map((opt) => (
                      <Label
                        key={opt.value}
                        className="flex items-start gap-3 rounded-md border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent"
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          checked={field.value === opt.value}
                          onChange={() => field.onChange(opt.value)}
                          className="mt-1 h-3.5 w-3.5 accent-primary"
                        />
                        <span className="text-sm">
                          <span className="font-medium">{opt.label}</span>
                          <br />
                          <span className="text-muted-foreground">
                            {opt.description}
                          </span>
                        </span>
                      </Label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Optional but recommended: register a domain when you&apos;re ready
              </p>
              <p className="mt-1">
                You don&apos;t need a custom domain to launch — the free{" "}
                <code>*.vercel.app</code> URL works fine. When you&apos;re
                ready, registering a domain (~$10/year) lets Resend send
                branded emails from <code>you@yourdomain.com</code>, looks
                more trustworthy on landing pages, and survives any future
                hosting change.
              </p>
              <p className="mt-2">Two registrars worth using:</p>
              <ul className="ml-5 mt-1 list-disc space-y-0.5">
                <li>
                  <a
                    href="https://www.cloudflare.com/products/registrar/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    Cloudflare Registrar
                  </a>
                  {" "}— at-cost pricing, no markup. Doesn&apos;t sell every TLD.
                </li>
                <li>
                  <a
                    href="https://porkbun.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    Porkbun
                  </a>
                  {" "}— wide TLD selection, friendly UI, slightly above at-cost.
                </li>
              </ul>
            </div>

            <FormField
              control={form.control}
              name="customDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom domain</FormLabel>
                  <FormControl>
                    <Input placeholder="app.example.com" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Optional. You can add this in Vercel later.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO meta description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="One sentence that shows up in Google. 150–160 chars sweet spot."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ogImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenGraph image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…/og.png" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Shown when your URL is shared on Twitter / LinkedIn /
                    iMessage. 1200×630 is the standard size.
                  </p>
                </FormItem>
              )}
            />

            <StageFormFooter
              onSaveOnly={onSaveOnly}
              saving={saving}
              submitting={form.formState.isSubmitting}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
