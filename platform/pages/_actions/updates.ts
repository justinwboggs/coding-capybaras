"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/platform/db/client";
import { platformAuditLog, platformUsers } from "@/platform/db/schema/platform";
import { requireAuth } from "@/platform/lib/auth";
import { canAccess } from "@/platform/lib/billing";
import { CURRENT_VERSION } from "@/platform/lib/version";

type ActionResult = { ok: true } | { error: string };

/**
 * Mark CURRENT_VERSION as seen for the current Pro user. Writes
 * platform_users.metadata.last_seen_version so the in-app "Update available"
 * indicator clears until the next version bump.
 *
 * Server re-checks canAccess('updates.notifications') — the indicator visibility
 * on the client is UX, not enforcement.
 */
export async function acknowledgeUpdateAction(): Promise<ActionResult> {
  const user = await requireAuth();

  if (!(await canAccess(user.id, "updates.notifications"))) {
    return { error: "Update notifications are a Pro feature." };
  }

  try {
    // JSONB merge: preserves any other metadata keys while updating
    // last_seen_version. The patch value is parameterized — no SQL string
    // concatenation, even though CURRENT_VERSION is a compile-time constant.
    const patch = JSON.stringify({ last_seen_version: CURRENT_VERSION });
    await db
      .update(platformUsers)
      .set({
        metadata: sql`${platformUsers.metadata} || ${patch}::jsonb`,
      })
      .where(eq(platformUsers.id, user.id));

    await db.insert(platformAuditLog).values({
      userId: user.id,
      action: "updates.acknowledged",
      resourceType: "user",
      resourceId: user.id,
      metadata: { version: CURRENT_VERSION },
    });
  } catch (err) {
    console.error("[updates] acknowledgeUpdateAction failed", err);
    return { error: "Couldn't acknowledge. Please try again." };
  }

  // Layouts read user metadata to decide whether to show the indicator.
  revalidatePath("/", "layout");
  return { ok: true };
}
