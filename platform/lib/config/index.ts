// ─────────────────────────────────────────────────────────────────
// Platform configuration layer. Reads (and writes) platform_config —
// the "configuration over code" store. User-tunable settings (branding,
// email copy, …) live here, NOT in code or env vars (SPEC.md §10,
// CLAUDE.md §6). Reads are cached per request; writes go through server
// actions, which call setConfigValues here.
// ─────────────────────────────────────────────────────────────────
import "server-only";

import { cache } from "react";

import { db } from "@/platform/db/client";
import { platformConfig } from "@/platform/db/schema/platform";

// Config keys are namespaced strings. These constants keep call sites
// typo-free; email-template keys are generated in lib/email/templates.
export const CONFIG_KEYS = {
  brandingAppName: "branding.app_name",
  brandingPrimaryColor: "branding.primary_color",
  brandingLogoUrl: "branding.logo_url",
  // Where requireJourneyComplete() sends users with an incomplete journey.
  // "journey" (default) is the right answer for Sarah's local boilerplate.
  // "docs" is the right answer for codingcapybaras.com itself, where new
  // signups need the install-tutorial flow, not the staged Supabase setup.
  // See platform/lib/journey/queries.ts for the redirect site.
  onboardingInitialRedirect: "onboarding.initial_redirect",
} as const;

export interface Branding {
  appName: string;
  primaryColor: string;
  logoUrl: string;
}

// Defaults used until an admin saves a value in /config/branding.
export const DEFAULT_BRANDING: Branding = {
  // COPY_TODO: review brand naming.
  appName: "Your SaaS",
  primaryColor: "#18181b",
  logoUrl: "",
};

/** Where new signups go before they've completed the staged journey. */
export type OnboardingInitialRedirect = "docs" | "journey";

/**
 * "journey" is the safe default — that's the right answer for Sarah's
 * downloaded boilerplate. The "docs" variant is opt-in via /config/onboarding
 * for deployments (like codingcapybaras.com) where the journey isn't
 * relevant to the end user.
 */
export const DEFAULT_ONBOARDING_INITIAL_REDIRECT: OnboardingInitialRedirect =
  "journey";

/**
 * Every platform_config row as a key→value map — the single DB read all
 * other config helpers fan out from. Cached per request, so a page that
 * reads branding + email templates + … hits the table once.
 *
 * Resilient by design: if the query fails, callers fall back to their
 * hardcoded defaults rather than crashing the page. The marketing site
 * stays up even if the DB is briefly unavailable.
 */
export const getAllConfig = cache(
  async (): Promise<Record<string, unknown>> => {
    try {
      const rows = await db.select().from(platformConfig);
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch (err) {
      console.error(
        "[config] getAllConfig failed — falling back to defaults",
        err,
      );
      return {};
    }
  },
);

/** A single config value, or `fallback` if unset. */
export async function getConfigValue<T>(key: string, fallback: T): Promise<T> {
  const all = await getAllConfig();
  const value = all[key];
  return value === undefined || value === null ? fallback : (value as T);
}

/**
 * Where requireJourneyComplete() should send users with an incomplete
 * journey. Reads platform_config; falls back to "journey" if missing or
 * invalid. Cached per request via getAllConfig().
 */
export async function getOnboardingInitialRedirect(): Promise<OnboardingInitialRedirect> {
  const all = await getAllConfig();
  const raw = all[CONFIG_KEYS.onboardingInitialRedirect];
  return raw === "docs" || raw === "journey"
    ? raw
    : DEFAULT_ONBOARDING_INITIAL_REDIRECT;
}

/**
 * Resolved branding — configured values with hardcoded defaults filled in.
 * Layouts and metadata read this instead of hardcoding "Platform".
 */
export async function getBranding(): Promise<Branding> {
  const all = await getAllConfig();
  const str = (key: string, fallback: string) => {
    const v = all[key];
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };
  return {
    appName: str(CONFIG_KEYS.brandingAppName, DEFAULT_BRANDING.appName),
    primaryColor: str(
      CONFIG_KEYS.brandingPrimaryColor,
      DEFAULT_BRANDING.primaryColor,
    ),
    logoUrl: str(CONFIG_KEYS.brandingLogoUrl, DEFAULT_BRANDING.logoUrl),
  };
}

/**
 * Upsert a batch of config rows. The write path for the configuration GUI —
 * called only from server actions, which own auth, validation, audit
 * logging, and cache revalidation. NOT cached.
 */
export async function setConfigValues(
  entries: { key: string; value: unknown }[],
): Promise<void> {
  for (const { key, value } of entries) {
    await db
      .insert(platformConfig)
      .values({ key, value })
      .onConflictDoUpdate({
        target: platformConfig.key,
        set: { value, updatedAt: new Date() },
      });
  }
}
