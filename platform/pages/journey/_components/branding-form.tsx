"use client";

import { useTransition } from "react";
import Link from "next/link";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Input } from "@/platform/components/ui/input";
import {
  brandingStageRequiredSchema,
  type BrandingStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { StageFormFooter } from "./stage-form-footer";

export function BrandingForm({ initial }: { initial: BrandingStageInput }) {
  const [saving, startSaving] = useTransition();
  const form = useForm<BrandingStageInput>({
    resolver: zodResolver(brandingStageRequiredSchema),
    defaultValues: {
      appName: initial.appName ?? "",
      primaryColor: initial.primaryColor ?? "",
      logoUrl: initial.logoUrl ?? "",
      tagline: initial.tagline ?? "",
    },
  });

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "branding",
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

  async function onContinue(values: BrandingStageInput) {
    const result = await saveStageAction({
      stage: "branding",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
  }

  const colorValue = form.watch("primaryColor") ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Saved to <code>platform_config</code> — these values show across the
          site (header, footer, tab title). You can refine in{" "}
          <Link
            href="/config/branding"
            className="underline underline-offset-2"
          >
            /config/branding
          </Link>{" "}
          later.
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
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    App name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Platform" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Pre-filled from Stage 1. Edit if you want them different.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color</FormLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Primary color picker"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(colorValue)
                          ? colorValue
                          : "#000000"
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                    />
                    <FormControl>
                      <Input
                        placeholder="#1e3a6d"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…/logo.svg" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Paste a hosted image URL. Upload comes later.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="One short sentence under your app name"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="button" asChild variant="ghost" size="sm">
              <Link href="/config/branding">Advanced branding options →</Link>
            </Button>

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
