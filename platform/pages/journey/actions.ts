"use server";

import { type Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/platform/db/client";
import { platformAuditLog, platformJourney } from "@/platform/db/schema/platform";
import { requireAuth } from "@/platform/lib/auth";
import {
  CONFIG_KEYS,
  getAllConfig,
  getBranding,
  setConfigValues,
} from "@/platform/lib/config";
import { generateEnvFileTemplate } from "@/platform/lib/journey/env-templates";
import { getOrCreateJourney } from "@/platform/lib/journey/queries";
import {
  getNextStage,
  maxStage,
  STAGE_KEYS,
  type JourneyData,
  type StageKey,
} from "@/platform/lib/journey/stages";
import {
  brandingStageRequiredSchema,
  brandingStageSchema,
  deployStageRequiredSchema,
  deployStageSchema,
  emailStageRequiredSchema,
  emailStageSchema,
  foundationStageRequiredSchema,
  foundationStageSchema,
  launchPrepStageRequiredSchema,
  launchPrepStageSchema,
  paymentsStageRequiredSchema,
  paymentsStageSchema,
  projectStageRequiredSchema,
  projectStageSchema,
} from "@/platform/lib/validation/journey";

type ActionResult = { ok: true } | { error: string };
type EnvFileResult = { ok: true; content: string } | { error: string };

// Attestation-only stages: forms collect booleans (not secret values). The
// action stores them under data[stage].attestations and sets confirmed=true
// + confirmed_at on the continue intent.
const ATTESTATION_STAGES = new Set<StageKey>([
  "foundation",
  "payments",
  "email",
]);

// Lax schema (save intent — partial saves allowed) vs strict (continue intent —
// required fields enforced). See lib/validation/journey.ts for the pair.
const STAGE_SCHEMAS = {
  project: { lax: projectStageSchema, strict: projectStageRequiredSchema },
  foundation: {
    lax: foundationStageSchema,
    strict: foundationStageRequiredSchema,
  },
  payments: { lax: paymentsStageSchema, strict: paymentsStageRequiredSchema },
  email: { lax: emailStageSchema, strict: emailStageRequiredSchema },
  branding: { lax: brandingStageSchema, strict: brandingStageRequiredSchema },
  "launch-prep": {
    lax: launchPrepStageSchema,
    strict: launchPrepStageRequiredSchema,
  },
  deploy: { lax: deployStageSchema, strict: deployStageRequiredSchema },
} as const;

function isStageKey(s: string): s is StageKey {
  return (STAGE_KEYS as readonly string[]).includes(s);
}

/**
 * Persist a stage's form data. Two intents:
 *
 *  - "save"     → partial save with the lax schema. No currentStage change,
 *                 no completion, no redirect. The form toasts on the client.
 *  - "continue" → strict-schema validation. On success: advances currentStage
 *                 (or sets completed_at if this is the last stage), writes
 *                 an audit row, redirects to the next stage (or /dashboard).
 *
 * Special-case stages:
 *  - project:  also writes platform_config.branding.app_name so the configured
 *              branding mirrors the project name out of the box.
 *  - branding: writes platform_config (NOT journey.data.branding) — branding
 *              is a first-class concept. journey.data.branding just carries
 *              a {completed: bool} flag so isStageComplete() can tell.
 */
export async function saveStageAction(input: {
  stage: string;
  data: Record<string, unknown>;
  intent: "save" | "continue";
}): Promise<ActionResult> {
  const user = await requireAuth();

  if (!isStageKey(input.stage)) {
    return { error: "Unknown stage." };
  }
  const stage: StageKey = input.stage;
  const schemaPair = STAGE_SCHEMAS[stage];
  const schema =
    input.intent === "continue" ? schemaPair.strict : schemaPair.lax;

  const parsed = schema.safeParse(input.data ?? {});
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  const parsedData = parsed.data as Record<string, unknown>;

  let redirectPath: string | null = null;
  let auditAction = "journey.stage_saved";

  try {
    const existing = await getOrCreateJourney(user.id);
    const data: JourneyData = { ...((existing.data ?? {}) as JourneyData) };

    if (stage === "branding") {
      const b = parsedData as {
        appName?: string;
        primaryColor?: string;
        logoUrl?: string;
        tagline?: string;
      };
      // Skip-on-no-change guard: compare each field against the value
      // already in effect. getBranding() resolves code defaults too, so a
      // field the user never touched (pre-filled from the current default)
      // compares equal and is NOT written — completing the stage no longer
      // freezes the then-current defaults into platform_config. The
      // emptiness / string-typeof checks below are kept; the !== check is
      // additive. (Both reads are request-cached — one DB round-trip.)
      const resolved = await getBranding();
      const currentTagline = (await getAllConfig())["branding.tagline"];
      const entries: { key: string; value: unknown }[] = [];
      if (
        b.appName &&
        b.appName.length > 0 &&
        b.appName !== resolved.appName
      ) {
        entries.push({ key: CONFIG_KEYS.brandingAppName, value: b.appName });
      }
      if (
        b.primaryColor &&
        b.primaryColor.length > 0 &&
        b.primaryColor !== resolved.primaryColor
      ) {
        entries.push({
          key: CONFIG_KEYS.brandingPrimaryColor,
          value: b.primaryColor,
        });
      }
      if (typeof b.logoUrl === "string" && b.logoUrl !== resolved.logoUrl) {
        entries.push({ key: CONFIG_KEYS.brandingLogoUrl, value: b.logoUrl });
      }
      if (typeof b.tagline === "string" && b.tagline !== currentTagline) {
        entries.push({ key: "branding.tagline", value: b.tagline });
      }
      if (entries.length > 0) await setConfigValues(entries);

      // Completion flag — appName presence is the source of truth.
      data.branding = {
        completed:
          typeof b.appName === "string" && b.appName.trim().length > 0,
      };
    } else if (ATTESTATION_STAGES.has(stage)) {
      // ⚠ SECURITY: persist ONLY attestation booleans + confirmed flags. We
      // deliberately do NOT spread `previous` — that would preserve any
      // legacy secret fields a pre-Tranche-10.1 user might have. Every save
      // overwrites the stage payload with the safe shape, so old secrets
      // vanish on the next interaction even if the cleanup SQL wasn't run.
      const previous = (data[stage] ?? {}) as Record<string, unknown>;
      const previousAttestations =
        (previous.attestations as Record<string, unknown> | undefined) ?? {};
      const stagePayload: Record<string, unknown> = {
        attestations: { ...previousAttestations, ...parsedData },
      };
      if (input.intent === "continue") {
        stagePayload.confirmed = true;
        stagePayload.confirmed_at = new Date().toISOString();
      }
      data[stage] = stagePayload;
    } else {
      data[stage] = {
        ...((data[stage] ?? {}) as Record<string, unknown>),
        ...parsedData,
      };
    }

    // Project name flows into branding.app_name automatically — first-tranche
    // dogfood: don't make users type their name twice.
    if (stage === "project") {
      const p = parsedData as { name?: string };
      if (p.name && p.name.length > 0) {
        await setConfigValues([
          { key: CONFIG_KEYS.brandingAppName, value: p.name },
        ]);
      }
    }

    let newCurrentStage = existing.currentStage as StageKey;
    let completedAt = existing.completedAt;

    if (input.intent === "continue") {
      const next = getNextStage(stage);
      if (next) {
        newCurrentStage = maxStage(newCurrentStage, next);
        redirectPath = `/journey/${next}`;
        auditAction = "journey.stage_completed";
      } else {
        // Last stage → mark the whole journey done.
        completedAt = new Date();
        redirectPath = "/dashboard";
        auditAction = "journey.completed";
      }
    }

    await db
      .update(platformJourney)
      .set({ currentStage: newCurrentStage, data, completedAt })
      .where(eq(platformJourney.userId, user.id));

    await db.insert(platformAuditLog).values({
      userId: user.id,
      action: auditAction,
      resourceType: "journey",
      resourceId: user.id,
      metadata: { stage, intent: input.intent },
    });
  } catch (err) {
    console.error("[journey] saveStageAction failed", err);
    return { error: "Couldn't save. Please try again." };
  }

  // The journey state powers gates (requireJourneyComplete) and the sidebar
  // icons across many routes — revalidate broadly.
  revalidatePath("/", "layout");

  if (redirectPath) redirect(redirectPath as Route);
  return { ok: true };
}

/**
 * Mark the journey complete WITHOUT walking the stages. Sets completed_at
 * = now so the gate stops redirecting to /journey. Audit-logged separately
 * from journey.completed so we can tell who skipped vs who finished.
 */
export async function skipJourneyAction(): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    await getOrCreateJourney(user.id); // ensure row exists
    await db
      .update(platformJourney)
      .set({ completedAt: new Date() })
      .where(eq(platformJourney.userId, user.id));

    await db.insert(platformAuditLog).values({
      userId: user.id,
      action: "journey.skipped",
      resourceType: "journey",
      resourceId: user.id,
      metadata: {},
    });
  } catch (err) {
    console.error("[journey] skipJourneyAction failed", err);
    return { error: "Couldn't skip. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Return the STATIC .env.local template. Identical for every user — the
 * platform never reads journey.data or any other user-specific state here,
 * so this download can't leak secrets between users (because we never
 * collect any). requireAuth is still called so the download stays behind
 * the authed surface, but the response is the same constant template.
 */
export async function generateEnvFileAction(): Promise<EnvFileResult> {
  await requireAuth();
  try {
    return { ok: true, content: generateEnvFileTemplate() };
  } catch (err) {
    console.error("[journey] generateEnvFileAction failed", err);
    return { error: "Couldn't generate the env file." };
  }
}
