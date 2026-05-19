"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { Input } from "@/platform/components/ui/input";
import { Label } from "@/platform/components/ui/label";
import { Textarea } from "@/platform/components/ui/textarea";
import {
  pricingFormSchema,
  type PricingFormInput,
} from "@/platform/lib/validation/config";

import { savePricingAction } from "../actions";

export function PricingForm({
  initialPlans,
}: {
  initialPlans: PricingFormInput["plans"];
}) {
  const form = useForm<PricingFormInput>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: { plans: initialPlans },
  });
  const { fields } = useFieldArray({ control: form.control, name: "plans" });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: PricingFormInput) {
    const result = await savePricingAction(values);
    if ("error" in result) {
      toast.error("Couldn't save pricing", { description: result.error });
      return;
    }
    toast.success("Pricing saved", {
      description: "Plan changes are live on the pricing page.",
    });
    form.reset(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
        <CardDescription>
          Plan display names, amounts, intervals, and feature lists. Reads and
          writes <code>platform_plans</code> directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Amount changes are display-only.</strong> Editing a plan&apos;s
          amount here updates what the pricing page shows — it does{" "}
          <em>not</em> change what Stripe bills. To change the billing amount,
          create a new price in the Stripe dashboard and update{" "}
          <code>platform_plans.provider_ids</code> via SQL. Automatic Stripe
          sync is V1.5.
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {fields.map((field, i) => {
            const planErrors = errors.plans?.[i];
            return (
              <div key={field.id} className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold capitalize">{field.key}</h3>
                {/* key has no input — register it hidden so it's in the payload */}
                <input type="hidden" {...register(`plans.${i}.key`)} />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`plan-${i}-name`}>Display name</Label>
                    <Input
                      id={`plan-${i}-name`}
                      {...register(`plans.${i}.displayName`)}
                    />
                    {planErrors?.displayName && (
                      <p className="text-sm font-medium text-destructive">
                        {planErrors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plan-${i}-amount`}>Amount (USD)</Label>
                    <Input
                      id={`plan-${i}-amount`}
                      type="number"
                      min={0}
                      step="1"
                      {...register(`plans.${i}.amountDollars`)}
                    />
                    {planErrors?.amountDollars && (
                      <p className="text-sm font-medium text-destructive">
                        {planErrors.amountDollars.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plan-${i}-interval`}>Interval</Label>
                    <select
                      id={`plan-${i}-interval`}
                      {...register(`plans.${i}.interval`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`plan-${i}-features`}>
                    Features (one per line)
                  </Label>
                  <Textarea
                    id={`plan-${i}-features`}
                    rows={5}
                    className="font-mono text-xs"
                    {...register(`plans.${i}.featuresText`)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use feature keys like <code>core</code> or{" "}
                    <code>multi_tenancy</code> — they map to{" "}
                    <code>canAccess()</code> checks. The Feature Flags tab is a
                    guided editor for the same data.
                  </p>
                </div>
              </div>
            );
          })}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save pricing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
