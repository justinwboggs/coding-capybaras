"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/platform/components/ui/badge";
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
import { Label } from "@/platform/components/ui/label";
import { Textarea } from "@/platform/components/ui/textarea";
import { brandingSchema, type BrandingInput } from "@/platform/lib/validation/config";
import { tierMeets, type Tier } from "@/platform/lib/tier/predicates";

import { saveBrandingAction } from "../actions";
import { BrandingPreview } from "./branding-preview";

const FONT_OPTIONS = [
  { value: "system", label: "System default" },
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
  { value: "serif", label: "Serif" },
] as const;

const RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

const HEADING_FONT_OPTIONS = [
  { value: "", label: "Match body font" },
  { value: "system", label: "System default" },
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
  { value: "serif", label: "Serif" },
] as const;

export function BrandingForm({
  initial,
  tier,
}: {
  initial: BrandingInput;
  tier: Tier;
}) {
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
  const backgroundValue = watched.backgroundColor;

  // L3 is rendered always but disabled below Pro — admins see what they
  // could unlock; the server action defensively drops L3 entries when
  // the tier isn't met (see saveBrandingAction).
  const hasPro = tierMeets(tier, "pro");

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
              {/* ── Identity ─────────────────────────────────────────── */}
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
                name="legalEntityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal entity name</FormLabel>
                    <FormControl>
                      <Input placeholder="[YOUR COMPANY NAME]" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      <strong>COPY_TODO:</strong> Used in Terms of Service and
                      other legal copy. Must match your registered business
                      name.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attribution"
                render={({ field }) => (
                  <FormItem>
                    <Label className="flex items-start gap-2 rounded-md border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 accent-primary"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          Show &ldquo;Built by Coding Capybaras&rdquo; badge in
                          footer
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          Help us by crediting Coding Capybaras in your footer
                          (opt-in).
                        </span>
                      </span>
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Theme (L2 — Free) ────────────────────────────────── */}
              <div className="border-t pt-5">
                <h3 className="mb-3 text-sm font-medium">Theme</h3>

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
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Background color</FormLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          aria-label="Background color picker"
                          value={
                            /^#[0-9a-fA-F]{6}$/.test(backgroundValue)
                              ? backgroundValue
                              : "#ffffff"
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                        />
                        <FormControl>
                          <Input
                            placeholder="#ffffff"
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The base page background.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fontFamily"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Body font</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {FONT_OPTIONS.map((opt) => (
                          <Label
                            key={opt.value}
                            className="flex items-center gap-2 rounded-md border p-2 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent"
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </Label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Inter and Geist load from Google Fonts on first paint.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="borderRadius"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Border radius</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {RADIUS_OPTIONS.map((opt) => (
                          <Label
                            key={opt.value}
                            className="flex items-center justify-center gap-2 rounded-md border p-2 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent"
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </Label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applies to buttons, cards, inputs — the whole UI.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Pro features (L3) ────────────────────────────────── */}
              <div
                className={
                  "border-t pt-5" + (hasPro ? "" : " opacity-70")
                }
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-medium">Pro features</h3>
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    {hasPro ? "Unlocked" : <Lock className="size-3" />}
                    {hasPro ? null : "Pro"}
                  </Badge>
                </div>
                {!hasPro && (
                  <p className="mb-4 text-xs text-muted-foreground">
                    Set <code>PLATFORM_TIER=pro</code> in your env to unlock
                    full token overrides, advanced typography, and custom CSS.
                  </p>
                )}

                {/* Token overrides (4 hex pickers). Empty = no override. */}
                {(
                  [
                    {
                      name: "foregroundColor",
                      label: "Foreground (text)",
                    },
                    { name: "mutedColor", label: "Muted" },
                    { name: "accentColor", label: "Accent" },
                    { name: "borderColor", label: "Border" },
                  ] as const
                ).map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => {
                      const value = field.value ?? "";
                      const isValid = /^#[0-9a-fA-F]{6}$/.test(value);
                      return (
                        <FormItem className="mt-4">
                          <FormLabel>{label}</FormLabel>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              aria-label={`${label} color picker`}
                              value={isValid ? value : "#000000"}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={!hasPro}
                              className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <FormControl>
                              <Input
                                placeholder="#000000 — leave blank to inherit"
                                className="font-mono"
                                disabled={!hasPro}
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="headingFontFamily"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Heading font</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {HEADING_FONT_OPTIONS.map((opt) => (
                          <Label
                            key={opt.value || "inherit"}
                            className={
                              "flex items-center gap-2 rounded-md border p-2 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent" +
                              (hasPro ? "" : " cursor-not-allowed")
                            }
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              disabled={!hasPro}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </Label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fontScale"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Font scale</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.025"
                          min="0.875"
                          max="1.25"
                          disabled={!hasPro}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Multiplier on the base font size. Range 0.875×–1.25×;
                        1× is the default.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customCss"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Custom CSS</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          placeholder={
                            ":root {\n  /* your overrides */\n}"
                          }
                          className="font-mono text-xs"
                          disabled={!hasPro}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Injected verbatim into a global <code>&lt;style&gt;</code>{" "}
                        block. <strong>No scoping or safety net</strong> — a
                        bad rule can blank the site. Test changes on a staging
                        deployment first.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
        backgroundColor={watched.backgroundColor}
        fontFamily={watched.fontFamily}
        borderRadius={watched.borderRadius}
        foregroundColor={watched.foregroundColor}
        mutedColor={watched.mutedColor}
        accentColor={watched.accentColor}
        borderColor={watched.borderColor}
        headingFontFamily={watched.headingFontFamily}
        fontScale={Number(watched.fontScale) || 1}
        hasCustomCss={(watched.customCss ?? "").trim().length > 0}
      />
    </div>
  );
}
