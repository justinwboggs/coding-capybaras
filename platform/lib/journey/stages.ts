// ─────────────────────────────────────────────────────────────────
// Stage definitions for the guided journey UX.
//
// The journey is the platform's biggest differentiator vs ShipFast/Makerkit —
// they ship code with no guided experience. We walk users from "I have an
// idea" to "I'm live on the internet" through seven stages.
//
// Each stage's data shape is validated separately in lib/validation/journey.ts.
// This file owns the *order* and *metadata*. Required-vs-optional semantics
// for "stage complete" live in isStageComplete() below — keep that and the
// per-stage form schemas in sync.
// ─────────────────────────────────────────────────────────────────

export type StageKey =
  | "project"
  | "foundation"
  | "payments"
  | "email"
  | "branding"
  | "launch-prep"
  | "deploy";

export interface StageDef {
  key: StageKey;
  title: string;
  description: string;
  estimatedMinutes: number;
}

// Ordered list — the journey advances through these in sequence.
export const STAGES: readonly StageDef[] = [
  {
    key: "project",
    title: "Your project",
    description: "Name what you're building and who it's for.",
    estimatedMinutes: 5,
  },
  {
    key: "foundation",
    title: "Foundation",
    description: "Connect Supabase — your database and auth backend.",
    estimatedMinutes: 10,
  },
  {
    key: "payments",
    title: "Payments",
    description: "Connect Stripe so you can charge customers.",
    estimatedMinutes: 10,
  },
  {
    key: "email",
    title: "Email",
    description: "Connect Resend so you can send transactional emails.",
    estimatedMinutes: 5,
  },
  {
    key: "branding",
    title: "Branding",
    description: "App name, color, and logo — what users see first.",
    estimatedMinutes: 5,
  },
  {
    key: "launch-prep",
    title: "Launch prep",
    description: "Legal pages, refund policy, and a launch checklist.",
    estimatedMinutes: 10,
  },
  {
    key: "deploy",
    title: "Deploy",
    description: "Push it live and tell the world.",
    estimatedMinutes: 15,
  },
] as const;

export const STAGE_KEYS: readonly StageKey[] = STAGES.map((s) => s.key);

export function getStageDef(key: StageKey): StageDef {
  const def = STAGES.find((s) => s.key === key);
  if (!def) throw new Error(`Unknown stage: ${key}`);
  return def;
}

export function getStageIndex(key: StageKey): number {
  const i = STAGE_KEYS.indexOf(key);
  if (i < 0) throw new Error(`Unknown stage: ${key}`);
  return i;
}

/** The next stage in sequence, or null if `key` is the final stage. */
export function getNextStage(key: StageKey): StageKey | null {
  const i = getStageIndex(key);
  return i < STAGES.length - 1 ? STAGES[i + 1].key : null;
}

/**
 * Pick whichever of two stage keys is "further along". Used when a user
 * revisits an earlier completed stage — currentStage tracks the farthest
 * point reached and shouldn't move backwards.
 */
export function maxStage(a: StageKey, b: StageKey): StageKey {
  return getStageIndex(a) >= getStageIndex(b) ? a : b;
}

// ── Per-stage "is this complete?" semantics ──────────────────────
// These match the strict (required-fields) Zod schemas in
// lib/validation/journey.ts. The action layer additionally re-validates
// with those schemas — this helper is for read-only render decisions
// (sidebar icons, "completed" badges).

type StageData = Record<string, unknown> | undefined;

function nonEmptyString(v: unknown, minLen = 1): boolean {
  return typeof v === "string" && v.trim().length >= minLen;
}

export function isStageComplete(stage: StageKey, data: StageData): boolean {
  if (!data) return false;
  switch (stage) {
    case "project":
      return nonEmptyString(data.name) && nonEmptyString(data.what, 10);
    // Foundation / Payments / Email are *attestation-only* stages — by design
    // we never collect secret values via web forms. `data.confirmed = true` is
    // set by the action when the user ticks every attestation checkbox and
    // hits Continue. See SECURITY_REDESIGN.md / Tranche 10.1 in the change log.
    case "foundation":
    case "payments":
    case "email":
      return data.confirmed === true;
    case "branding":
      // Branding writes to platform_config, not journey.data. Completion is
      // tracked by `journey.data.branding.completed = true` (set on save).
      return data.completed === true;
    case "launch-prep":
      return (
        data.termsAccepted === true &&
        data.privacyAccepted === true &&
        nonEmptyString(data.refundPolicy)
      );
    case "deploy":
      return nonEmptyString(data.deploymentUrl);
  }
}

// ── Journey-level helpers ────────────────────────────────────────

export interface JourneyData {
  project?: Record<string, unknown>;
  foundation?: Record<string, unknown>;
  payments?: Record<string, unknown>;
  email?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  "launch-prep"?: Record<string, unknown>;
  deploy?: Record<string, unknown>;
}

/**
 * The first stage whose data isn't complete. Returns the final stage if all
 * are complete (the journey is fully filled; the row's completed_at marks the
 * "I'm done" state separately).
 */
export function firstIncompleteStage(data: JourneyData): StageKey {
  for (const stage of STAGE_KEYS) {
    if (!isStageComplete(stage, data[stage])) return stage;
  }
  return STAGE_KEYS[STAGE_KEYS.length - 1];
}

/** Fraction of stages whose data is complete. Used in the progress header. */
export function completionFraction(data: JourneyData): number {
  const done = STAGE_KEYS.filter((s) => isStageComplete(s, data[s])).length;
  return done / STAGE_KEYS.length;
}
