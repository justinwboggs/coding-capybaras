"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
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
import { Textarea } from "@/platform/components/ui/textarea";
import { brandingSchema, type BrandingInput } from "@/platform/lib/validation/config";

import { saveBrandingAction } from "../actions";
import { BrandingPreview } from "./branding-preview";

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

  // watch() with no args returns all values and re-renders on every edit —
  // that's what drives the live preview panel.
  const watched = form.watch();
  const colorValue = watched.primaryColor;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            These values render in the site header, footer, and browser tab —
            no code changes needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
                      <Input placeholder="Your brand name" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Shown in the navbar, browser title, and emails. Keep it
                      short.
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
                    <p className="text-xs text-muted-foreground">
                      Used for buttons, links, and accents across the site.
                      Pick a hex that fits your brand — watch the live preview
                      update as you type.
                    </p>
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
                      Paste a hosted URL for now (Imgur, Cloudinary, or upload
                      to /public). Native upload coming later.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => {
                  const len = field.value?.length ?? 0;
                  const over = len > 160;
                  return (
                    <FormItem>
                      <FormLabel>Meta description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="A one-or-two-sentence summary of what your product does and who it's for."
                          {...field}
                        />
                      </FormControl>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Used in the page &lt;meta name=&quot;description&quot;&gt;, OG
                          and Twitter cards, and structured data. Leave blank to
                          omit the tag entirely.
                        </p>
                        <p
                          className={
                            over
                              ? "shrink-0 text-xs text-destructive"
                              : "shrink-0 text-xs text-muted-foreground"
                          }
                          aria-live="polite"
                        >
                          {len} / 160
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save branding"}
              </Button>
            </form>
          </Form>

          {/* GUI complements AI coding — it doesn't replace it. */}
          <div className="flex items-start gap-2.5 rounded-md border bg-muted/40 p-3">
            <Info
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              Want changes beyond these controls? Open Claude Code or Cursor in
              your project and describe what you want. The GUI handles common
              cases; AI coding handles everything else.
            </p>
          </div>
        </CardContent>
      </Card>

      <BrandingPreview
        appName={watched.appName}
        primaryColor={watched.primaryColor}
        logoUrl={watched.logoUrl}
        metaDescription={watched.metaDescription}
      />
    </div>
  );
}
