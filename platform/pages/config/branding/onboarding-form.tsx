"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Label } from "@/platform/components/ui/label";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/platform/lib/validation/config";

import { saveOnboardingAction } from "../actions";

const OPTIONS = [
  {
    value: "journey",
    label: "Journey (default)",
    description:
      "Send new users to the Better.com-style staged journey (Supabase, Stripe, Resend, etc.). Use this when your users are running this app locally and need to set up their own infrastructure.",
  },
  {
    value: "docs",
    label: "Docs",
    description:
      "Send new users to the docs flow (install editor, install Node, download boilerplate, first run). Use this when this app is the marketing site for a downloadable boilerplate, and the journey isn't relevant on this deployment.",
  },
] as const;

export function OnboardingForm({ initial }: { initial: OnboardingInput }) {
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: OnboardingInput) {
    const result = await saveOnboardingAction(values);
    if ("error" in result) {
      toast.error("Couldn't save onboarding setting", {
        description: result.error,
      });
      return;
    }
    toast.success("Onboarding saved", {
      description:
        values.initialRedirect === "docs"
          ? "New signups will land in /docs."
          : "New signups will land in /journey.",
    });
    form.reset(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>
          How new signups are routed before they&apos;ve completed the
          journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="initialRedirect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial redirect</FormLabel>
                  <div className="space-y-2">
                    {OPTIONS.map((opt) => (
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

            <p className="text-xs text-muted-foreground">
              This setting only affects the auto-redirect off{" "}
              <code>/dashboard</code> (and other gated pages) for users with
              an incomplete journey. The journey UI at <code>/journey</code>{" "}
              still works in either mode — a user who navigates there
              directly always sees the staged setup.
            </p>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save onboarding"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
