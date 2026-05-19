import { EMAIL_TEMPLATES, getEmailTemplate } from "@/platform/lib/email/templates";

import { EmailTemplatesForm } from "./email-templates-form";

export const metadata = { title: "Email Templates — Configuration" };

export default async function EmailTemplatesConfigPage() {
  // Resolve each template config-first (configured value, else hardcoded
  // default) so the form opens showing exactly what would be sent today.
  const templates = await Promise.all(
    EMAIL_TEMPLATES.map(async (def) => {
      const resolved = await getEmailTemplate(def.key);
      return {
        key: def.key,
        label: def.label,
        description: def.description,
        variables: def.variables,
        subject: resolved.subject,
        body: resolved.body,
      };
    }),
  );

  return <EmailTemplatesForm templates={templates} />;
}
