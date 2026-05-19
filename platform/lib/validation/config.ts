import { z } from "zod";

// Shared Zod schemas for the configuration GUI. Each is used by both the
// client RHF resolver and the server action that persists the change —
// the server never trusts what the client sends.

// ── Branding ─────────────────────────────────────────────────────
export const brandingSchema = z.object({
  appName: z
    .string()
    .trim()
    .min(1, "App name is required")
    .max(60, "Keep it under 60 characters"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #1e3a6d"),
  logoUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(z.literal("")),
});
export type BrandingInput = z.infer<typeof brandingSchema>;

// ── Pricing ──────────────────────────────────────────────────────
// The form shape, used by both the client resolver and the server action.
// `featuresText` is a textarea (one feature per line); the action splits it
// into the platform_plans.features array after validation.
export const pricingFormPlanSchema = z.object({
  key: z.enum(["free", "pro", "business"]),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(60, "Keep it under 60 characters"),
  amountDollars: z.coerce
    .number()
    .min(0, "Amount can't be negative")
    .max(100000, "That amount looks too high"),
  interval: z.enum(["month", "year"]),
  featuresText: z.string(),
});
export const pricingFormSchema = z.object({
  plans: z.array(pricingFormPlanSchema).length(3),
});
export type PricingFormInput = z.infer<typeof pricingFormSchema>;

// ── Email templates ──────────────────────────────────────────────
export const emailTemplateSchema = z.object({
  key: z.string().min(1),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Keep the subject under 200 characters"),
  body: z.string().trim().min(1, "Body is required"),
});
export const emailTemplatesFormSchema = z.object({
  templates: z.array(emailTemplateSchema).min(1),
});
export type EmailTemplatesFormInput = z.infer<typeof emailTemplatesFormSchema>;

// ── Feature flags ────────────────────────────────────────────────
// Per-plan arrays of feature keys. preprocess() smooths over RHF's quirk of
// handing back a non-array when a checkbox group is fully unchecked. The
// action additionally filters to the known FEATURE_REGISTRY before writing.
const featureKeyList = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.string()),
);
export const featureFlagsSchema = z.object({
  free: featureKeyList,
  pro: featureKeyList,
  business: featureKeyList,
});
export type FeatureFlagsInput = z.infer<typeof featureFlagsSchema>;

// ── Onboarding ───────────────────────────────────────────────────
// Single-key config. The mode determines where requireJourneyComplete()
// sends users with an incomplete journey — see platform/lib/journey/queries.ts.
export const onboardingSchema = z.object({
  initialRedirect: z.enum(["docs", "journey"]),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
