// ─────────────────────────────────────────────────────────────────
// Journey read helpers + gate.
//
// getOrCreateJourney() is the single create-site — the row is lazy and
// only materializes the first time the user hits /journey. Pages outside
// /journey call requireJourneyComplete() at the top to redirect users who
// haven't finished (or skipped) the journey yet.
// ─────────────────────────────────────────────────────────────────
import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/platform/db/client";
import { platformJourney, type PlatformJourney } from "@/platform/db/schema/platform";
import { getOnboardingInitialRedirect } from "@/platform/lib/config";

import {
  firstIncompleteStage,
  type JourneyData,
  type StageKey,
} from "./stages";

/** The user's journey row, or null if they've never started. Cached per request. */
export const getJourney = cache(
  async (userId: string): Promise<PlatformJourney | null> => {
    const [row] = await db
      .select()
      .from(platformJourney)
      .where(eq(platformJourney.userId, userId))
      .limit(1);
    return row ?? null;
  },
);

/**
 * Returns the user's journey row, creating one with defaults if it doesn't
 * exist yet. Insert is idempotent under ON CONFLICT DO NOTHING so concurrent
 * first-access from two layout renders can't race.
 */
export async function getOrCreateJourney(
  userId: string,
): Promise<PlatformJourney> {
  const existing = await getJourney(userId);
  if (existing) return existing;

  await db
    .insert(platformJourney)
    .values({ userId })
    .onConflictDoNothing({ target: platformJourney.userId });

  const [created] = await db
    .select()
    .from(platformJourney)
    .where(eq(platformJourney.userId, userId))
    .limit(1);
  if (!created) {
    // Extremely unlikely — the insert was idempotent and we just queried it.
    throw new Error(`Failed to create journey row for user ${userId}`);
  }
  return created;
}

/**
 * Gate for pages OUTSIDE the journey (dashboard, account, config). Sends the
 * user to /journey OR /docs (per platform_config.onboarding.initial_redirect)
 * if they haven't completed (or skipped) it. Pages INSIDE /journey/* must NOT
 * call this — they'd redirect to themselves on every load.
 *
 * Default mode is "journey" — the right answer for Sarah's local boilerplate
 * where new signups need to set up Supabase/Stripe/Resend. Admins on a public
 * marketing deployment (like codingcapybaras.com) can flip the mode to "docs"
 * in /config/onboarding so new signups land in the install-tutorial flow
 * instead. The journey UI at /journey/* still works in either mode — the
 * config only affects the auto-intercept here.
 */
export async function requireJourneyComplete(userId: string): Promise<void> {
  const journey = await getJourney(userId);
  if (!journey || journey.completedAt === null) {
    const mode = await getOnboardingInitialRedirect();
    redirect(mode === "docs" ? "/docs" : "/journey");
  }
}

/**
 * Where /journey itself should land the user — their first incomplete stage,
 * or /dashboard if the journey is already done. The journey row must already
 * exist (call getOrCreateJourney first).
 */
export function journeyLandingPath(journey: PlatformJourney): string {
  if (journey.completedAt !== null) return "/dashboard";
  const data = (journey.data ?? {}) as JourneyData;
  const next: StageKey = firstIncompleteStage(data);
  return `/journey/${next}`;
}
