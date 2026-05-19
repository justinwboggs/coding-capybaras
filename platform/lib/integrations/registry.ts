// ─────────────────────────────────────────────────────────────────
// Integration marketplace registry.
//
// Each entry describes one third-party integration: a name, a category, a
// short description, and the install instructions that surface in
// /config/integrations.
//
// V1 ships with an empty registry — the UI gracefully renders an empty state.
// Real integrations land in subsequent tranches.
// ─────────────────────────────────────────────────────────────────

export type IntegrationCategory =
  | "analytics"
  | "email"
  | "payments"
  | "auth"
  | "crm"
  | "support"
  | "ai"
  | "other";

export interface IntegrationDef {
  /** Stable identifier, e.g. "posthog", "intercom". Keep kebab-case. */
  key: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  /** Optional. Hosted image URL — rendered next to the name when present. */
  logoUrl?: string;
  /**
   * Install instructions, currently treated as plain text in the UI.
   * Real markdown rendering can be added later if/when an integration ships
   * with structured headings/code blocks worth styling.
   */
  installInstructions: string;
}

// Starts empty by design. Add entries in dedicated integration tranches so
// each one ships with its own README + test pass.
export const INTEGRATION_REGISTRY: IntegrationDef[] = [];

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> =
  {
    analytics: "Analytics",
    email: "Email",
    payments: "Payments",
    auth: "Auth",
    crm: "CRM",
    support: "Support",
    ai: "AI",
    other: "Other",
  };
