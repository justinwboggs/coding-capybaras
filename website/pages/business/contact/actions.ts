"use server";

import { db } from "@/platform/db/client";
import { platformBusinessInquiries } from "@/platform/db/schema/platform";
import { getSupportEmail, sendEmail } from "@/platform/lib/email";
import { businessInquirySchema } from "@/platform/lib/validation/business";

// Public — no auth required. The client form calls this with the typed input.
type ActionResult = { ok: true } | { error: string };

export async function submitBusinessInquiryAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = businessInquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  const { name, email, company, whatBuilding, teamSize } = parsed.data;

  try {
    // Persist the lead first — even if the email send fails, we don't want to
    // lose the inquiry. RLS on platform_business_inquiries lets anon INSERT
    // (the form is public); only admins can SELECT.
    await db.insert(platformBusinessInquiries).values({
      name,
      email,
      company: company && company.length > 0 ? company : null,
      whatBuilding,
      teamSize,
    });

    // Internal alert via sendEmail (CLAUDE.md: all email goes through this
    // helper). Never throws — failures are logged to platform_email_log.
    await sendEmail({
      to: getSupportEmail(),
      templateKey: "business_inquiry_received",
      data: {
        name,
        email,
        company: company && company.length > 0 ? company : "(not provided)",
        what_building: whatBuilding,
        team_size: teamSize,
      },
    });
  } catch (err) {
    console.error("[business/contact] submitBusinessInquiryAction failed", err);
    return { error: "Couldn't submit. Please email us directly." };
  }

  return { ok: true };
}
