import { z } from "zod";

// Shared Zod schemas for the configuration GUI. Each is used by both the
// client RHF resolver and the server action that persists the change —
// the server never trusts what the client sends.

// ── Branding ─────────────────────────────────────────────────────
// L1 = always-on identity fields; L2 = Free-tier theme additions;
// L3 = Pro-gated. The full schema is uniform regardless of tier — the
// server action (saveBrandingAction) silently drops L3 entries when
// the deployment isn't on Pro+. The form mirrors this by disabling
// L3 inputs at the UI layer.
const hexOrEmpty = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #1e3a6d")
  .or(z.literal(""));

export const brandingSchema = z.object({
  // L1 — identity
  appName: z
    .string()
    .trim()
    .min(1, "App name is required")
    .max(60, "Keep it under 60 characters"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #1e3a6d"),
  logoUrl: z.string().trim().url("Must be a valid URL").or(z.literal("")),
  // L1 — used in Terms of Service and other legal copy. Tenant MUST set this
  // to their registered business name before launch; the default
  // "[YOUR COMPANY NAME]" placeholder makes an unconfigured ToS visible.
  legalEntityName: z
    .string()
    .trim()
    .min(1, "Legal entity name is required")
    .max(120, "Keep it under 120 characters"),
  // L1 — opt-in "Built by Coding Capybaras" marketing-footer badge.
  attribution: z.boolean(),
  // L2 — Free tier
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #ffffff"),
  fontFamily: z.enum(["system", "inter", "geist", "serif"]),
  borderRadius: z.enum(["none", "sm", "md", "lg"]),
  // L3 — Pro-gated (empty string ⇒ no override)
  foregroundColor: hexOrEmpty,
  mutedColor: hexOrEmpty,
  accentColor: hexOrEmpty,
  borderColor: hexOrEmpty,
  headingFontFamily: z
    .enum(["system", "inter", "geist", "serif"])
    .or(z.literal("")),
  fontScale: z.coerce
    .number()
    .min(0.875, "Smallest supported scale is 0.875×")
    .max(1.25, "Largest supported scale is 1.25×"),
  customCss: z
    .string()
    .max(8000, "Keep custom CSS under 8000 characters"),
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
// Two orthogonal keys:
//   - `mode` toggles whether the journey gate exists at all. When "skip",
//     requireJourneyComplete() becomes a no-op and /journey redirects to
//     /dashboard. `initialRedirect` is moot in that case.
//   - `initialRedirect` (only meaningful when mode is "journey") determines
//     where requireJourneyComplete() sends users with an incomplete journey
//     — see platform/lib/journey/queries.ts.
export const onboardingSchema = z.object({
  mode: z.enum(["journey", "skip"]),
  initialRedirect: z.enum(["docs", "journey"]),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
