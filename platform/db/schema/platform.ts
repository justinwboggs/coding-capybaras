import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Mirror Supabase's auth.users so we can express a cross-schema FK.
// Drizzle won't try to migrate this — it's declared, not owned.
const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// ──────────────────────────────────────────────────────────────────
// platform_users — application-side user row, 1:1 with auth.users.
// Created via DB trigger on auth.users insert (see 0001_rls_policies.sql).
// ──────────────────────────────────────────────────────────────────
export const platformUsers = pgTable("platform_users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  // Admin-controlled tier override (Tranche 17). NULL = derive entitlement
  // from platform_subscriptions normally; non-null = force this plan key
  // regardless of subscription state. FK is enforced via the manual
  // migration in 0004_admin_overrides.sql — drizzle-kit doesn't manage
  // platform_plans (text PK with FK), so we declare the column shape here
  // and rely on the migration for the constraint.
  manualPlanOverride: text("manual_plan_override"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
});

// ──────────────────────────────────────────────────────────────────
// platform_payment_customers — Stripe/BCPartners customer records.
// (provider, external_id) is unique so webhook upserts are idempotent.
// ──────────────────────────────────────────────────────────────────
export const platformPaymentCustomers = pgTable(
  "platform_payment_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => platformUsers.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    provider: text("provider").notNull(), // 'stripe' | 'bcpartners'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("platform_payment_customers_provider_external_id_uq").on(
      t.provider,
      t.externalId,
    ),
  ],
);

// ──────────────────────────────────────────────────────────────────
// platform_plans — pricing catalog. DB is source of truth, not Stripe.
// ──────────────────────────────────────────────────────────────────
export const platformPlans = pgTable("platform_plans", {
  key: text("key").primaryKey(), // 'free' | 'pro' | 'business'
  displayName: text("display_name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  interval: text("interval").notNull(), // 'month' | 'year' (ignored when mode='payment')
  // Checkout mode: 'subscription' (recurring) or 'payment' (one-time).
  // Pro is 'payment' for the Tranche 9 launch (one-time $97 → lifetime access);
  // future plans may be either.
  mode: text("mode").notNull().default("subscription"),
  providerIds: jsonb("provider_ids").notNull().default({}), // {stripe: 'price_xxx', ...}
  features: jsonb("features").notNull().default([]),
});

// ──────────────────────────────────────────────────────────────────
// platform_subscriptions — synced from webhooks. Never query provider.
// (provider, external_id) is unique so webhook upserts are idempotent.
// ──────────────────────────────────────────────────────────────────
export const platformSubscriptions = pgTable(
  "platform_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => platformUsers.id, { onDelete: "cascade" }),
    paymentCustomerId: uuid("payment_customer_id")
      .notNull()
      .references(() => platformPaymentCustomers.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    provider: text("provider").notNull(),
    status: text("status").notNull(), // 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
    planKey: text("plan_key")
      .notNull()
      .references(() => platformPlans.key),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [
    uniqueIndex("platform_subscriptions_provider_external_id_uq").on(
      t.provider,
      t.externalId,
    ),
  ],
);

// ──────────────────────────────────────────────────────────────────
// platform_usage_events — feature usage / metered billing source.
// ──────────────────────────────────────────────────────────────────
export const platformUsageEvents = pgTable("platform_usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => platformUsers.id, { onDelete: "cascade" }),
  eventName: text("event_name").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// platform_email_log — every transactional email send.
// ──────────────────────────────────────────────────────────────────
export const platformEmailLog = pgTable("platform_email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => platformUsers.id, {
    onDelete: "set null",
  }),
  toAddress: text("to_address").notNull(),
  templateKey: text("template_key").notNull(),
  status: text("status").notNull(), // 'sent' | 'failed' | 'queued'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// platform_audit_log — admin & sensitive actions.
// ──────────────────────────────────────────────────────────────────
export const platformAuditLog = pgTable("platform_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => platformUsers.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// platform_config — user-tunable settings, replaces "code edits".
// ──────────────────────────────────────────────────────────────────
export const platformConfig = pgTable("platform_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// platform_journey — per-user state for the guided onboarding flow.
// One row per user (PK = user_id). `data` is nested per-stage JSONB
// (e.g. data.foundation.supabaseUrl). `current_stage` advances on
// stage completion; `completed_at` set when all stages are done OR
// when the user explicitly skips the journey.
// ──────────────────────────────────────────────────────────────────
export const platformJourney = pgTable("platform_journey", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => platformUsers.id, { onDelete: "cascade" }),
  currentStage: text("current_stage").notNull().default("project"),
  data: jsonb("data").notNull().default({}),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ──────────────────────────────────────────────────────────────────
// platform_support_requests — Pro tier priority support submissions.
// RLS: users SELECT/INSERT their own; admins SELECT all + UPDATE status.
// ──────────────────────────────────────────────────────────────────
export const platformSupportRequests = pgTable("platform_support_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => platformUsers.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // 'open' | 'in_progress' | 'closed'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// platform_business_inquiries — Business-tier contact form leads.
// RLS: anon can INSERT (public form); only admins can SELECT.
// ──────────────────────────────────────────────────────────────────
export const platformBusinessInquiries = pgTable(
  "platform_business_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    whatBuilding: text("what_building").notNull(),
    teamSize: text("team_size").notNull(), // '1-5' | '6-20' | '21-100' | '100+'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

// Inferred row types — use these in DTOs and server actions.
export type PlatformUser = typeof platformUsers.$inferSelect;
export type PlatformPaymentCustomer =
  typeof platformPaymentCustomers.$inferSelect;
export type PlatformPlan = typeof platformPlans.$inferSelect;
export type PlatformSubscription = typeof platformSubscriptions.$inferSelect;
export type PlatformUsageEvent = typeof platformUsageEvents.$inferSelect;
export type PlatformEmailLogEntry = typeof platformEmailLog.$inferSelect;
export type PlatformAuditLogEntry = typeof platformAuditLog.$inferSelect;
export type PlatformConfigEntry = typeof platformConfig.$inferSelect;
export type PlatformSupportRequest =
  typeof platformSupportRequests.$inferSelect;
export type PlatformBusinessInquiry =
  typeof platformBusinessInquiries.$inferSelect;
export type PlatformJourney = typeof platformJourney.$inferSelect;
