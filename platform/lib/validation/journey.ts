import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Per-stage Zod schemas — two flavors each:
//
//   *StageSchema:           lax. Used by the SAVE intent (autosave +
//                           "Save and continue later"). Everything optional —
//                           we don't want to block a partial save.
//   *StageRequiredSchema:   strict. Used by the CONTINUE intent (advance to
//                           the next stage). Mirrors isStageComplete() in
//                           lib/journey/stages.ts.
//
// Same schema runs client (RHF resolver) and server (action validation).
// ─────────────────────────────────────────────────────────────────

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));

// ── project ──────────────────────────────────────────────────────
export const projectStageSchema = z.object({
  name: optionalText(80),
  what: optionalText(2000),
  audience: optionalText(2000),
  category: z
    .enum(["saas", "marketplace", "content", "tool", "other"])
    .optional()
    .or(z.literal("")),
});
export const projectStageRequiredSchema = projectStageSchema.extend({
  name: z.string().trim().min(1, "Project name is required").max(80),
  what: z
    .string()
    .trim()
    .min(10, "Tell us a sentence or two about what you're building")
    .max(2000),
});
export type ProjectStageInput = z.infer<typeof projectStageSchema>;

// ── foundation / payments / email ────────────────────────────────
// These three stages handle third-party SECRETS (Supabase keys, Stripe keys,
// Resend API key). By design the platform never collects these — the journey
// instead displays instructions + a static env template, and the user
// self-attests that they've added the values to their own local .env.local.
// See lib/journey/env-templates.ts and the security callouts in the forms.
//
// Schemas are attestation booleans only. The strict variants require all
// checkboxes to be true to advance to the next stage.

const attestationRequired = (message: string) =>
  z.literal(true, { errorMap: () => ({ message }) });

// foundation: three confirmations.
export const foundationStageSchema = z.object({
  createdProject: z.boolean().optional(),
  addedEnvVars: z.boolean().optional(),
  verifiedGitignore: z.boolean().optional(),
});
export const foundationStageRequiredSchema = z.object({
  createdProject: attestationRequired(
    "Confirm you've created your Supabase project",
  ),
  addedEnvVars: attestationRequired(
    "Confirm you've added the Supabase env vars locally",
  ),
  verifiedGitignore: attestationRequired(
    "Confirm your .env.local is gitignored",
  ),
});
export type FoundationStageInput = z.infer<typeof foundationStageSchema>;

// payments: two confirmations.
export const paymentsStageSchema = z.object({
  createdAccount: z.boolean().optional(),
  addedEnvVars: z.boolean().optional(),
});
export const paymentsStageRequiredSchema = z.object({
  createdAccount: attestationRequired(
    "Confirm you've created or signed into your Stripe account",
  ),
  addedEnvVars: attestationRequired(
    "Confirm you've added the Stripe env vars locally",
  ),
});
export type PaymentsStageInput = z.infer<typeof paymentsStageSchema>;

// email: two confirmations.
export const emailStageSchema = z.object({
  createdAccount: z.boolean().optional(),
  addedEnvVars: z.boolean().optional(),
});
export const emailStageRequiredSchema = z.object({
  createdAccount: attestationRequired(
    "Confirm you've created your Resend account",
  ),
  addedEnvVars: attestationRequired(
    "Confirm you've added the Resend env vars locally",
  ),
});
export type EmailStageInput = z.infer<typeof emailStageSchema>;

// ── branding ─────────────────────────────────────────────────────
// Writes to platform_config (not journey.data). The stage's "complete" flag
// is journey.data.branding.completed = true, set in the action.
export const brandingStageSchema = z.object({
  appName: optionalText(80),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color, e.g. #1e3a6d")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
  tagline: optionalText(200),
});
export const brandingStageRequiredSchema = brandingStageSchema.extend({
  appName: z.string().trim().min(1, "App name is required").max(80),
});
export type BrandingStageInput = z.infer<typeof brandingStageSchema>;

// ── launch-prep ──────────────────────────────────────────────────
const refundPolicySchema = z.enum([
  "30-day-no-questions",
  "case-by-case",
  "no-refunds",
]);
export const launchPrepStageSchema = z.object({
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  refundPolicy: refundPolicySchema.optional().or(z.literal("")),
  customDomain: optionalText(200),
  seoDescription: optionalText(300),
  ogImageUrl: optionalText(2000),
});
export const launchPrepStageRequiredSchema = launchPrepStageSchema.extend({
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you've reviewed the Terms" }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm you've reviewed the Privacy Policy",
    }),
  }),
  refundPolicy: refundPolicySchema,
});
export type LaunchPrepStageInput = z.infer<typeof launchPrepStageSchema>;

// ── deploy ───────────────────────────────────────────────────────
export const deployStageSchema = z.object({
  deploymentUrl: optionalText(500),
  stripeLiveMode: z.boolean().optional(),
  announcementMade: z.boolean().optional(),
});
export const deployStageRequiredSchema = deployStageSchema.extend({
  deploymentUrl: z
    .string()
    .trim()
    .min(1, "Paste your live URL once you've deployed")
    .max(500),
});
export type DeployStageInput = z.infer<typeof deployStageSchema>;
