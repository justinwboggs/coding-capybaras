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
import type { FeatureDef } from "@/platform/lib/billing";
import {
  featureFlagsSchema,
  type FeatureFlagsInput,
} from "@/platform/lib/validation/config";

import { saveFeatureFlagsAction } from "../actions";

const PLANS = ["free", "pro", "business"] as const;

export function FeatureFlagsForm({
  features,
  initial,
}: {
  features: FeatureDef[];
  initial: FeatureFlagsInput;
}) {
  const form = useForm<FeatureFlagsInput>({
    resolver: zodResolver(featureFlagsSchema),
    defaultValues: initial,
  });
  const {
    register,
    formState: { isSubmitting },
  } = form;

  async function onSubmit(values: FeatureFlagsInput) {
    const result = await saveFeatureFlagsAction(values);
    if ("error" in result) {
      toast.error("Couldn't save feature flags", {
        description: result.error,
      });
      return;
    }
    toast.success("Feature flags saved", {
      description: "canAccess() now reflects the new plan entitlements.",
    });
    form.reset(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Which features each plan unlocks. Writes{" "}
          <code>platform_plans.features</code> — the array{" "}
          <code>canAccess()</code> checks at request time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Feature</th>
                  {PLANS.map((p) => (
                    <th
                      key={p}
                      className="px-3 py-2 font-medium capitalize"
                    >
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.key} className="border-b last:border-0">
                    <td className="py-3 pr-4 align-top">
                      <div className="font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground">
                        <code>{f.key}</code> — {f.description}
                      </div>
                    </td>
                    {PLANS.map((p) => (
                      <td key={p} className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          value={f.key}
                          aria-label={`${f.label} on ${p}`}
                          className="h-4 w-4 cursor-pointer accent-primary"
                          {...register(p)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save feature flags"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
