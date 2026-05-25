"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/platform/db/client";
import { platformAuditLog, platformPlans } from "@/platform/db/schema/platform";
import { requireAdmin } from "@/platform/lib/auth";
import { FEATURE_KEYS } from "@/platform/lib/billing";
import { CONFIG_KEYS, setConfigValues } from "@/platform/lib/config";
import { emailConfigKeys } from "@/platform/lib/email/templates";
import { getTier, tierMeets } from "@/platform/lib/tier";
import {
  brandingSchema,
  emailTemplatesFormSchema,
  featureFlagsSchema,
  onboardingSchema,
  pricingFormSchema,
} from "@/platform/lib/validation/config";

// Server actions return this on the error path; success returns { ok: true }.
// The client forms toast on either outcome — no redirects, these just save.
type ActionResult = { ok: true } | { error: string };

// Every admin config write gets an audit row. resourceType is "config"; the
// specific action string (config.branding.updated, …) carries the detail.
async function writeAudit(
  userId: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await db.insert(platformAuditLog).values({
    userId,
    action,
    resourceType: "config",
    resourceId: null,
    metadata,
  });
}

// ── Branding ─────────────────────────────────────────────────────
export async function saveBrandingAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid branding values.",
    };
  }
  const {
    appName,
    primaryColor,
    logoUrl,
    legalEntityName,
    attribution,
    backgroundColor,
    fontFamily,
    borderRadius,
    foregroundColor,
    mutedColor,
    accentColor,
    borderColor,
    headingFontFamily,
    fontScale,
    customCss,
  } = parsed.data;

  // L3 fields are tier-gated. The form disables them on Free at the UI
  // layer; this is the defensive backstop — a tampered client submission
  // with L3 values populated is silently filtered, not hard-rejected.
  const tier = getTier();
  const hasPro = tierMeets(tier, "pro");

  try {
    const entries: { key: string; value: unknown }[] = [
      { key: CONFIG_KEYS.brandingAppName, value: appName },
      { key: CONFIG_KEYS.brandingPrimaryColor, value: primaryColor },
      { key: CONFIG_KEYS.brandingLogoUrl, value: logoUrl },
      { key: CONFIG_KEYS.brandingLegalEntityName, value: legalEntityName },
      { key: CONFIG_KEYS.brandingAttribution, value: attribution },
      // L2 — Free tier, always written.
      { key: CONFIG_KEYS.brandingBackgroundColor, value: backgroundColor },
      { key: CONFIG_KEYS.brandingFontFamily, value: fontFamily },
      { key: CONFIG_KEYS.brandingBorderRadius, value: borderRadius },
    ];
    if (hasPro) {
      entries.push(
        { key: CONFIG_KEYS.brandingForegroundColor, value: foregroundColor },
        { key: CONFIG_KEYS.brandingMutedColor, value: mutedColor },
        { key: CONFIG_KEYS.brandingAccentColor, value: accentColor },
        { key: CONFIG_KEYS.brandingBorderColor, value: borderColor },
        {
          key: CONFIG_KEYS.brandingHeadingFontFamily,
          value: headingFontFamily,
        },
        { key: CONFIG_KEYS.brandingFontScale, value: fontScale },
        { key: CONFIG_KEYS.brandingCustomCss, value: customCss },
      );
    }
    await setConfigValues(entries);
    await writeAudit(admin.id, "config.branding.updated", {
      tier,
      appName,
      primaryColor,
      logoUrl,
      legalEntityName,
      attribution,
      backgroundColor,
      fontFamily,
      borderRadius,
      ...(hasPro && {
        foregroundColor,
        mutedColor,
        accentColor,
        borderColor,
        headingFontFamily,
        fontScale,
        // customCss can be long — log its length, not its body.
        customCssLength: customCss.length,
      }),
    });
  } catch (err) {
    console.error("[config] saveBrandingAction failed", err);
    return { error: "Couldn't save branding. Please try again." };
  }

  // Branding shows in every layout header/footer + the browser-tab title.
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Pricing ──────────────────────────────────────────────────────
export async function savePricingAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = pricingFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid pricing values.",
    };
  }

  try {
    for (const plan of parsed.data.plans) {
      const features = plan.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
      await db
        .update(platformPlans)
        .set({
          displayName: plan.displayName,
          // Amount is stored in cents. This updates *display* only — it does
          // not touch Stripe. See the warning notice on the pricing form.
          amountCents: Math.round(plan.amountDollars * 100),
          interval: plan.interval,
          features,
        })
        .where(eq(platformPlans.key, plan.key));
    }
    await writeAudit(admin.id, "config.pricing.updated", {
      plans: parsed.data.plans.map((p) => ({
        key: p.key,
        displayName: p.displayName,
        amountCents: Math.round(p.amountDollars * 100),
        interval: p.interval,
      })),
    });
  } catch (err) {
    console.error("[config] savePricingAction failed", err);
    return { error: "Couldn't save pricing. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Email templates ──────────────────────────────────────────────
export async function saveEmailTemplatesAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = emailTemplatesFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid email template values.",
    };
  }

  try {
    const entries = parsed.data.templates.flatMap((t) => {
      const keys = emailConfigKeys(t.key);
      return [
        { key: keys.subject, value: t.subject },
        { key: keys.body, value: t.body },
      ];
    });
    await setConfigValues(entries);
    await writeAudit(admin.id, "config.email_templates.updated", {
      keys: parsed.data.templates.map((t) => t.key),
    });
  } catch (err) {
    console.error("[config] saveEmailTemplatesAction failed", err);
    return { error: "Couldn't save email templates. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Onboarding ───────────────────────────────────────────────────
export async function saveOnboardingAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid onboarding value.",
    };
  }
  const { mode, initialRedirect } = parsed.data;

  try {
    await setConfigValues([
      { key: CONFIG_KEYS.onboardingMode, value: mode },
      { key: CONFIG_KEYS.onboardingInitialRedirect, value: initialRedirect },
    ]);
    await writeAudit(admin.id, "config.onboarding.updated", {
      mode,
      initialRedirect,
    });
  } catch (err) {
    console.error("[config] saveOnboardingAction failed", err);
    return { error: "Couldn't save onboarding setting. Please try again." };
  }

  // Settings drive requireJourneyComplete() in the (authed) layout and the
  // /journey route's skip-mode redirect — revalidate at the layout boundary
  // so the next dashboard/journey hit reads fresh values.
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Feature flags ────────────────────────────────────────────────
export async function saveFeatureFlagsAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = featureFlagsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid feature-flag values." };
  }

  // The server trusts nothing — keep only known feature keys, dedup the rest.
  const clean = (keys: string[]) =>
    [...new Set(keys.filter((k) => FEATURE_KEYS.includes(k)))];

  try {
    const byPlan = {
      free: clean(parsed.data.free),
      pro: clean(parsed.data.pro),
      business: clean(parsed.data.business),
    } as const;

    for (const key of ["free", "pro", "business"] as const) {
      await db
        .update(platformPlans)
        .set({ features: byPlan[key] })
        .where(eq(platformPlans.key, key));
    }
    await writeAudit(admin.id, "config.feature_flags.updated", {
      free: byPlan.free,
      pro: byPlan.pro,
      business: byPlan.business,
    });
  } catch (err) {
    console.error("[config] saveFeatureFlagsAction failed", err);
    return { error: "Couldn't save feature flags. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
