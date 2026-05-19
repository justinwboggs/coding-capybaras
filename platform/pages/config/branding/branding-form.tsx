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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Input } from "@/platform/components/ui/input";
import { brandingSchema, type BrandingInput } from "@/platform/lib/validation/config";

import { saveBrandingAction } from "../actions";

export function BrandingForm({ initial }: { initial: BrandingInput }) {
  const form = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: BrandingInput) {
    const result = await saveBrandingAction(values);
    if ("error" in result) {
      toast.error("Couldn't save branding", { description: result.error });
      return;
    }
    toast.success("Branding saved", {
      description: "The new values are live across the site.",
    });
    form.reset(values);
  }

  const colorValue = form.watch("primaryColor");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          These values render in the site header, footer, and browser tab — no
          code changes needed.
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
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App name</FormLabel>
                  <FormControl>
                    <Input placeholder="Coding Capybaras" {...field} />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Logo upload is V2 — paste a hosted image URL for now. Primary
              color is saved now; applying it to the theme is a later tranche.
            </p>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save branding"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
