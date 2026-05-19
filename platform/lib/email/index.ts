// ─────────────────────────────────────────────────────────────────
// THIS IS THE ONLY FILE IN THE CODEBASE THAT IMPORTS THE RESEND SDK.
// All transactional email goes through sendEmail() — never import Resend
// anywhere else. (Mirrors the Stripe-SDK rule in CLAUDE.md / SPEC.md.)
// ─────────────────────────────────────────────────────────────────
import "server-only";

import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "@/platform/db/client";
import { platformEmailLog, platformUsers } from "@/platform/db/schema/platform";
import { getBranding } from "@/platform/lib/config";

import {
  getEmailTemplate,
  renderEmailTemplate,
  type EmailTemplateKey,
} from "./templates";

// Re-export so @/platform/lib/email is the single entry point for the email layer.
export type { EmailTemplateKey } from "./templates";

/**
 * Recipient for internal-routed messages (priority support, business
 * inquiries, future ops alerts). Configurable via SUPPORT_EMAIL; falls back
 * to the founder's email so the platform is never silently misconfigured.
 */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? "bjd.boggs@gmail.com";
}

// Lazy-init: reading RESEND_API_KEY at module load is fragile on serverless
// (and shadow-empty env vars bit us with Stripe in Tranche 6). Defer the env
// read to the first actual send so importing this module is always safe.
let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

/**
 * Flatten a nested data object into the dotted keys renderEmailTemplate
 * expects: { user: { email } } → { "user.email": "…" }. Scalars are
 * stringified; arrays and null/undefined are skipped.
 */
function flatten(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else if (v !== undefined && v !== null) {
      out[key] = String(v);
    }
  }
  return out;
}

export interface SendEmailParams {
  to: string;
  templateKey: EmailTemplateKey;
  data: Record<string, unknown>;
}

/**
 * Send a transactional email and record the attempt in platform_email_log.
 *
 * - Resolves the template config-first: admin edits in /config/email-templates
 *   win over the hardcoded defaults, then {{variables}} are substituted.
 * - {{app.name}} is injected automatically from branding config; callers pass
 *   the rest as `data` (nested objects are flattened to dotted keys, e.g.
 *   `{ user: { email } }` → `{{user.email}}`).
 * - NEVER throws. Failures are caught, logged to platform_email_log with
 *   status 'failed', and console.error'd. Callers (webhook handler, auth
 *   self-heal) can treat email as best-effort — it never blocks their work.
 *   Returns void either way.
 */
export async function sendEmail({
  to,
  templateKey,
  data,
}: SendEmailParams): Promise<void> {
  // Best-effort: link the log row to a platform user if `to` matches one.
  let userId: string | null = null;
  try {
    const [u] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.email, to))
      .limit(1);
    userId = u?.id ?? null;
  } catch {
    // Non-fatal — the log row just won't be linked to a user.
  }

  let status: "sent" | "failed" = "failed";
  try {
    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error("EMAIL_FROM is not set");

    const branding = await getBranding();
    const template = await getEmailTemplate(templateKey);
    const rendered = renderEmailTemplate(template, {
      "app.name": branding.appName,
      ...flatten(data),
    });

    const { error } = await getResendClient().emails.send({
      from,
      to,
      subject: rendered.subject,
      text: rendered.body,
    });
    if (error) {
      throw new Error(`Resend rejected the send: ${error.message}`);
    }
    status = "sent";
  } catch (err) {
    // Sentry isn't wired yet (see the webhook route's note) — console.error
    // is the current signal, and the 'failed' log row below is the record.
    console.error(`[email] sendEmail(${templateKey} → ${to}) failed`, err);
  }

  try {
    await db.insert(platformEmailLog).values({
      userId,
      toAddress: to,
      templateKey,
      status,
    });
  } catch (logErr) {
    console.error("[email] failed to write platform_email_log", logErr);
  }
}
