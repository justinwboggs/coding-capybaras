"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/platform/db/client";
import {
  platformAuditLog,
  platformSubscriptions,
  platformUsers,
} from "@/platform/db/schema/platform";
import { requireAdmin } from "@/platform/lib/auth";
import { getProvider } from "@/platform/lib/payments";
import { createSupabaseAdminClient } from "@/platform/lib/supabase/admin";

// ─────────────────────────────────────────────────────────────────
// Admin server actions. Every export is admin-gated via requireAdmin
// (throws redirect on non-admins) and writes an audit row on success.
//
// The client component (user-actions.tsx) calls these. Server actions
// are server-only by construction — the bundler strips the bodies from
// the client bundle.
// ─────────────────────────────────────────────────────────────────

type ActionResult = { ok: true } | { error: string };

async function writeAudit(
  userId: string,
  action: string,
  resourceId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await db.insert(platformAuditLog).values({
    userId,
    action,
    resourceType: "admin.user",
    resourceId,
    metadata,
  });
}

// ── Manual plan override ─────────────────────────────────────────
const overrideSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  // null clears the override; otherwise must be a known plan key.
  override: z.enum(["free", "pro", "business"]).nullable(),
});

export async function setManualPlanOverrideAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid override input.",
    };
  }
  const { userId, override } = parsed.data;

  try {
    // Capture the previous value so the audit row tells the full story.
    const [before] = await db
      .select({ override: platformUsers.manualPlanOverride })
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);
    if (!before) return { error: "User not found." };

    await db
      .update(platformUsers)
      .set({ manualPlanOverride: override })
      .where(eq(platformUsers.id, userId));

    await writeAudit(admin.id, "admin.user.override_set", userId, {
      before: before.override,
      after: override,
    });
  } catch (err) {
    console.error("[admin] setManualPlanOverrideAction failed", err);
    return { error: "Couldn't update override. Please try again." };
  }

  // Tier surfaces in many places (sidebar gates, /pricing, billing UI).
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Cancel subscription ──────────────────────────────────────────
const cancelSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  // atPeriodEnd true = graceful cancel (Stripe billing portal default);
  // false = immediate cancel. UI defaults to true.
  atPeriodEnd: z.boolean(),
});

export async function cancelSubscriptionAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid cancel input.",
    };
  }
  const { userId, atPeriodEnd } = parsed.data;

  try {
    // Pick the user's most recent entitled subscription. Webhooks will
    // sync the state change back; we don't update platform_subscriptions
    // ourselves to keep the provider as the source of truth.
    const subs = await db
      .select()
      .from(platformSubscriptions)
      .where(
        and(
          eq(platformSubscriptions.userId, userId),
          // status filter not pushed down — we want the most recent
          // regardless of status, then pick from there.
        ),
      )
      .orderBy(desc(platformSubscriptions.currentPeriodEnd));
    const target =
      subs.find((s) =>
        ["active", "trialing", "past_due"].includes(s.status),
      ) ?? subs[0];
    if (!target) {
      return { error: "This user has no subscription to cancel." };
    }

    const provider = getProvider();
    if (target.provider !== provider.name) {
      return {
        error: `Subscription is on "${target.provider}" but the active provider is "${provider.name}".`,
      };
    }
    await provider.cancelSubscription(target.externalId, { atPeriodEnd });

    await writeAudit(admin.id, "admin.user.subscription_canceled", userId, {
      externalId: target.externalId,
      provider: target.provider,
      atPeriodEnd,
      previousStatus: target.status,
    });
  } catch (err) {
    console.error("[admin] cancelSubscriptionAction failed", err);
    return {
      error: "Couldn't cancel the subscription. Please try again.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

// ── Delete user ──────────────────────────────────────────────────
const deleteSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  // The admin must re-type the user's email to confirm. We compare
  // server-side against the stored email before issuing the destructive
  // call.
  confirmEmail: z.string().trim().min(1, "Type the email to confirm"),
});

export async function deleteUserAction(
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid delete input.",
    };
  }
  const { userId, confirmEmail } = parsed.data;

  if (userId === admin.id) {
    return { error: "You can't delete your own admin account here." };
  }

  try {
    const [target] = await db
      .select({ email: platformUsers.email })
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);
    if (!target) return { error: "User not found." };

    if (confirmEmail.toLowerCase() !== target.email.toLowerCase()) {
      return { error: "Email confirmation didn't match." };
    }

    // Write the audit row BEFORE the destructive call. platform_audit_log
    // has ON DELETE SET NULL on user_id, so the row survives the delete
    // — but the resourceId text column always carries the deleted user's
    // id for the trail.
    await writeAudit(admin.id, "admin.user.deleted", userId, {
      email: target.email,
    });

    // Hard delete via Supabase admin SDK. Removes the auth.users row,
    // which cascades into platform_users and every FK-cascade child
    // (payment_customers, subscriptions, journey, usage_events, …).
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[admin] supabase.admin.deleteUser failed", error);
      return { error: `Delete failed: ${error.message}` };
    }
  } catch (err) {
    console.error("[admin] deleteUserAction failed", err);
    return { error: "Couldn't delete the user. Please try again." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}
