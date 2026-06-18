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
import {
  deployStageRequiredSchema,
  type DeployStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { StageFormFooter } from "./stage-form-footer";

export function DeployForm({ initial }: { initial: DeployStageInput }) {
  const [saving, startSaving] = useTransition();
  const form = useForm<DeployStageInput>({
    resolver: zodResolver(deployStageRequiredSchema),
    defaultValues: {
      deploymentUrl: initial.deploymentUrl ?? "",
      stripeLiveMode: initial.stripeLiveMode ?? false,
      announcementMade: initial.announcementMade ?? false,
    },
  });

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "deploy",
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

  async function onContinue(values: DeployStageInput) {
    const result = await saveStageAction({
      stage: "deploy",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't finish the journey", {
        description: result.error,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy</CardTitle>
        <CardDescription>
          Push to Vercel and paste the URL below. Signing into Vercel with <strong>GitHub</strong>{" "}
          makes importing your repo seamless — no extra connection step. Step-by-step:{" "}
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            vercel.com/new
          </a>{" "}
          → import your repo → paste all your <code>.env.local</code> vars into Vercel&apos;s env
          editor → Deploy. First build runs the migrations via the build command if you wired it up;
          otherwise run <code>pnpm db:migrate</code> locally pointing at the production
          DATABASE_URL.
        </CardDescription>
        <a
          href="https://vercel.com/docs/deployments/overview"
          target="_blank"
          rel="noreferrer"
          className="block w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Watch a 2-minute setup walkthrough →
        </a>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onContinue)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="deploymentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Deployment URL <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-app.vercel.app"
                      autoComplete="off"
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Paste the URL Vercel gives you after the first successful deploy.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stripeLiveMode"
              render={({ field }) => (
                <FormItem>
                  <Label className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-50 p-3 has-[input:checked]:border-amber-600 dark:bg-amber-950/40">
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-amber-600"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-amber-900 dark:text-amber-200">
                        I&apos;ve switched Stripe to live mode
                      </span>
                      <br />
                      <span className="text-amber-900/80 dark:text-amber-200/80">
                        Don&apos;t toggle this until you&apos;ve smoke-tested a full checkout +
                        webhook in test mode on the deployed URL. Replace <code>sk_test_</code>/
                        <code>pk_test_</code> with live keys in Vercel envs, and add a new live-mode
                        webhook endpoint pointing at{" "}
                        <code>https://yourapp.com/api/webhooks/stripe</code> (new{" "}
                        <code>whsec_</code> secret).
                      </span>
                    </span>
                  </Label>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="announcementMade"
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
                      <span className="font-medium">I&apos;ve made my launch announcement</span>
                      <br />
                      <span className="text-muted-foreground">
                        Twitter / LinkedIn / Product Hunt / your audience — wherever your people
                        are.
                      </span>
                    </span>
                  </Label>
                </FormItem>
              )}
            />

            <StageFormFooter
              onSaveOnly={onSaveOnly}
              saving={saving}
              submitting={form.formState.isSubmitting}
              continueLabel="Continue to last step"
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
