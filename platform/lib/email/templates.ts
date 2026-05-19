// ─────────────────────────────────────────────────────────────────
// Email template registry + config-first resolver.
//
// The *set* of templates is code — each maps to a real (future) send
// site. Their subject/body is configuration: an admin edits them in
// /config/email-templates, which writes platform_config. getEmailTemplate()
// resolves the configured value first, the hardcoded default second.
//
// sendEmail() (lib/email/index.ts) consumes getEmailTemplate() +
// renderEmailTemplate(), so admin config edits flow through to real sends.
// ─────────────────────────────────────────────────────────────────
import "server-only";

import { cache } from "react";

import { getAllConfig } from "@/platform/lib/config";

// The complete set of transactional templates. Adding one means adding a
// real send site too — keep this union and EMAIL_TEMPLATES in sync.
export type EmailTemplateKey =
  | "welcome"
  | "password_reset"
  | "payment_succeeded"
  | "payment_failed"
  | "subscription_canceled"
  | "support_request_received"
  | "business_inquiry_received";

export interface EmailTemplateDef {
  key: EmailTemplateKey;
  label: string;
  description: string;
  /** Variables available for {{substitution}} in subject/body. */
  variables: string[];
  defaultSubject: string;
  defaultBody: string;
}

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    key: "welcome",
    label: "Welcome",
    description: "Sent right after a new user signs up.",
    variables: ["{{user.email}}", "{{app.name}}"],
    defaultSubject: "Welcome to {{app.name}}",
    defaultBody:
      "Hi {{user.email}},\n\n" +
      "Welcome to {{app.name}} — we're glad you're here.\n\n" +
      "Head to your dashboard to get started.\n",
  },
  {
    key: "password_reset",
    label: "Password reset",
    description:
      "Reserved. V1 auth is magic-link only; used if email/password lands in V1.5+.",
    variables: ["{{user.email}}", "{{app.name}}", "{{reset.url}}"],
    defaultSubject: "Reset your {{app.name}} password",
    defaultBody:
      "Hi {{user.email}},\n\n" +
      "Use the link below to reset your password:\n\n" +
      "{{reset.url}}\n\n" +
      "If you didn't request this, you can safely ignore this email.\n",
  },
  {
    key: "payment_succeeded",
    label: "Payment succeeded",
    description: "Sent when a subscription payment is collected.",
    variables: ["{{user.email}}", "{{app.name}}", "{{plan.display_name}}"],
    defaultSubject: "Your {{app.name}} payment was received",
    defaultBody:
      "Hi {{user.email}},\n\n" +
      "We've received your payment for the {{plan.display_name}} plan. " +
      "Thanks for your support!\n",
  },
  {
    key: "payment_failed",
    label: "Payment failed",
    description: "Sent when a subscription payment fails.",
    variables: ["{{user.email}}", "{{app.name}}", "{{plan.display_name}}"],
    defaultSubject: "Action needed: your {{app.name}} payment failed",
    defaultBody:
      "Hi {{user.email}},\n\n" +
      "We couldn't process your payment for the {{plan.display_name}} plan. " +
      "Please update your payment details in the billing portal to keep your access.\n",
  },
  {
    key: "subscription_canceled",
    label: "Subscription canceled",
    description: "Sent when a subscription is canceled.",
    variables: ["{{user.email}}", "{{app.name}}", "{{plan.display_name}}"],
    defaultSubject: "Your {{app.name}} subscription was canceled",
    defaultBody:
      "Hi {{user.email}},\n\n" +
      "Your {{plan.display_name}} subscription has been canceled. " +
      "You're welcome back anytime.\n",
  },
  {
    key: "support_request_received",
    label: "Support request received (internal)",
    description:
      "Internal alert routed to SUPPORT_EMAIL when a Pro user submits priority support.",
    variables: [
      "{{user.email}}",
      "{{plan}}",
      "{{subject}}",
      "{{description}}",
      "{{page_url}}",
    ],
    defaultSubject: "[Support] {{subject}}",
    defaultBody:
      "From: {{user.email}}\n" +
      "Plan: {{plan}}\n" +
      "Page: {{page_url}}\n\n" +
      "Subject: {{subject}}\n\n" +
      "{{description}}\n",
  },
  {
    key: "business_inquiry_received",
    label: "Business inquiry received (internal)",
    description:
      "Internal alert routed to SUPPORT_EMAIL when someone submits the public Business contact form.",
    variables: [
      "{{name}}",
      "{{email}}",
      "{{company}}",
      "{{what_building}}",
      "{{team_size}}",
    ],
    defaultSubject: "[Business inquiry] {{name}} · {{team_size}}",
    defaultBody:
      "Name: {{name}}\n" +
      "Email: {{email}}\n" +
      "Company: {{company}}\n" +
      "Team size: {{team_size}}\n\n" +
      "What they're building:\n" +
      "{{what_building}}\n",
  },
];

export const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = EMAIL_TEMPLATES.map(
  (t) => t.key,
);

/** platform_config keys for a template's editable fields. */
export function emailConfigKeys(key: string): {
  subject: string;
  body: string;
} {
  return { subject: `email.${key}.subject`, body: `email.${key}.body` };
}

export interface ResolvedEmailTemplate {
  subject: string;
  body: string;
}

/**
 * Resolve a template's subject + body: the admin-configured value from
 * platform_config first, the hardcoded default second. Cached per request.
 */
export const getEmailTemplate = cache(
  async (key: EmailTemplateKey): Promise<ResolvedEmailTemplate> => {
    const def = EMAIL_TEMPLATES.find((t) => t.key === key);
    if (!def) throw new Error(`Unknown email template: ${key}`);

    const all = await getAllConfig();
    const keys = emailConfigKeys(key);
    const cfgSubject = all[keys.subject];
    const cfgBody = all[keys.body];

    return {
      subject:
        typeof cfgSubject === "string" && cfgSubject.length > 0
          ? cfgSubject
          : def.defaultSubject,
      body:
        typeof cfgBody === "string" && cfgBody.length > 0
          ? cfgBody
          : def.defaultBody,
    };
  },
);

/**
 * Substitute {{variable}} placeholders. Unknown placeholders are left
 * intact, so a misconfigured template is visible rather than silently blank.
 * Called by sendEmail() after the template is resolved.
 */
export function renderEmailTemplate(
  template: ResolvedEmailTemplate,
  vars: Record<string, string>,
): ResolvedEmailTemplate {
  const apply = (s: string) =>
    s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, name: string) =>
      name in vars ? vars[name] : `{{${name}}}`,
    );
  return { subject: apply(template.subject), body: apply(template.body) };
}
