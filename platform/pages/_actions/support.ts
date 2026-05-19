"use server";

import { db } from "@/platform/db/client";
import { platformAuditLog, platformSupportRequests } from "@/platform/db/schema/platform";
import { requireAuth } from "@/platform/lib/auth";
import { canAccess } from "@/platform/lib/billing";
import { getSupportEmail, sendEmail } from "@/platform/lib/email";
import { supportRequestSchema } from "@/platform/lib/validation/support";

type ActionResult = { ok: true } | { error: string };

/**
 * Submit a Pro-tier priority support request. Re-checks canAccess server-side
 * — the disabled button on non-Pro clients is UX, not enforcement.
 *
 * Effects:
 *   1. Insert into platform_support_requests (status='open')
 *   2. Internal alert to SUPPORT_EMAIL via sendEmail
 *   3. Audit log entry
 */
export async function submitSupportRequestAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireAuth();

  if (!(await canAccess(user.id, "support.priority"))) {
    return { error: "Priority support is a Pro feature." };
  }

  const parsed = supportRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  const { subject, description, pageUrl } = parsed.data;

  try {
    const [inserted] = await db
      .insert(platformSupportRequests)
      .values({
        userId: user.id,
        subject,
        description,
      })
      .returning({ id: platformSupportRequests.id });

    await sendEmail({
      to: getSupportEmail(),
      templateKey: "support_request_received",
      data: {
        user: { email: user.email },
        plan: "Pro",
        subject,
        description,
        page_url: pageUrl && pageUrl.length > 0 ? pageUrl : "(unknown)",
      },
    });

    await db.insert(platformAuditLog).values({
      userId: user.id,
      action: "support.request.submitted",
      resourceType: "support_request",
      resourceId: inserted?.id ?? null,
      metadata: { subject },
    });
  } catch (err) {
    console.error("[support] submitSupportRequestAction failed", err);
    return { error: "Couldn't submit. Please try again." };
  }

  return { ok: true };
}
