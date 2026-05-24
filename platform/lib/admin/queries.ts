import "server-only";

import { and, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";

import { db } from "@/platform/db/client";
import {
  platformAuditLog,
  platformSubscriptions,
  platformUsers,
  type PlatformAuditLogEntry,
} from "@/platform/db/schema/platform";
import { type PlanKey } from "@/platform/lib/billing";

// ─────────────────────────────────────────────────────────────────
// Admin DB reads. Server-only — every export queries via the Drizzle
// client (postgres + DATABASE_URL = service role; RLS is bypassed by
// that connection, which is what the admin dashboard needs to see
// every user regardless of self-read policy).
// ─────────────────────────────────────────────────────────────────

export const ADMIN_USERS_PAGE_SIZE = 25;
export const ADMIN_AUDIT_PAGE_SIZE = 50;

const ENTITLED_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export interface AdminUserRow {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  effectiveTier: PlanKey;
  isOverride: boolean;
  manualPlanOverride: PlanKey | null;
}

export interface ListUsersInput {
  q?: string;
  tier?: PlanKey | "all";
  page?: number;
}

export interface ListUsersResult {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Page through users with optional email search + tier filter. Computes
 * the effective tier per row (override > subscription > free) in TS
 * after the join — keeps the SQL simple and matches getUserPlan's
 * resolution order exactly.
 *
 * Tier filtering applies AFTER effective-tier resolution, so the page
 * total reflects the filtered set (search-paginated, not server-paginated
 * within the SQL).
 *
 * At v1 scale (hundreds to low thousands of users) this is fine. If the
 * table grows past ~10K rows, push the filter down into SQL — e.g. a
 * subquery joining subscriptions and overriding via COALESCE.
 */
export async function listUsers(
  input: ListUsersInput = {},
): Promise<ListUsersResult> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = ADMIN_USERS_PAGE_SIZE;
  const q = input.q?.trim() ?? "";
  const tierFilter = input.tier && input.tier !== "all" ? input.tier : null;

  // Pull every user row matching the email filter. Drizzle's ilike uses
  // postgres ILIKE — case-insensitive substring match.
  const userConditions = q ? ilike(platformUsers.email, `%${q}%`) : undefined;
  const allMatching = await db
    .select({
      id: platformUsers.id,
      email: platformUsers.email,
      isAdmin: platformUsers.isAdmin,
      createdAt: platformUsers.createdAt,
      override: platformUsers.manualPlanOverride,
    })
    .from(platformUsers)
    .where(userConditions)
    .orderBy(desc(platformUsers.createdAt));

  if (allMatching.length === 0) {
    return { rows: [], total: 0, page, pageSize };
  }

  // Single batch fetch of subscriptions for the matched user ids. Keeps
  // the read cost at two queries regardless of page size.
  const userIds = allMatching.map((u) => u.id);
  const subs = await db
    .select()
    .from(platformSubscriptions)
    .where(inArray(platformSubscriptions.userId, userIds));

  const subsByUser = new Map<string, (typeof subs)[number][]>();
  for (const s of subs) {
    const list = subsByUser.get(s.userId) ?? [];
    list.push(s);
    subsByUser.set(s.userId, list);
  }

  const resolvedRows: AdminUserRow[] = allMatching.map((u) => {
    const override = isPlanKey(u.override) ? u.override : null;
    let effective: PlanKey = "free";
    if (override) {
      effective = override;
    } else {
      const userSubs = subsByUser.get(u.id) ?? [];
      const entitled = userSubs.filter((s) => ENTITLED_STATUSES.has(s.status));
      if (entitled.length > 0) {
        entitled.sort(
          (a, b) =>
            (b.currentPeriodEnd?.getTime() ?? 0) -
            (a.currentPeriodEnd?.getTime() ?? 0),
        );
        if (isPlanKey(entitled[0].planKey)) effective = entitled[0].planKey;
      }
    }
    return {
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      effectiveTier: effective,
      isOverride: override !== null,
      manualPlanOverride: override,
    };
  });

  const filtered = tierFilter
    ? resolvedRows.filter((r) => r.effectiveTier === tierFilter)
    : resolvedRows;

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  return { rows, total, page, pageSize };
}

function isPlanKey(v: unknown): v is PlanKey {
  return v === "free" || v === "pro" || v === "business";
}

/** Total user count — drives the metrics tile. */
export async function countUsers(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformUsers);
  return row?.count ?? 0;
}

/** Users created since `since` (inclusive). Drives the 7d/30d tiles. */
export async function countNewUsersSince(since: Date): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformUsers)
    .where(gte(platformUsers.createdAt, since));
  return row?.count ?? 0;
}

/**
 * Tier breakdown across all users. Two queries: one user pull, one
 * subscription pull; resolution done in TS using the same precedence
 * as getUserPlan. Cheap at v1 scale.
 */
export async function countByTier(): Promise<Record<PlanKey, number>> {
  const result: Record<PlanKey, number> = { free: 0, pro: 0, business: 0 };
  const all = await db
    .select({
      id: platformUsers.id,
      override: platformUsers.manualPlanOverride,
    })
    .from(platformUsers);
  if (all.length === 0) return result;
  const userIds = all.map((u) => u.id);
  const subs = await db
    .select()
    .from(platformSubscriptions)
    .where(inArray(platformSubscriptions.userId, userIds));
  const subsByUser = new Map<string, (typeof subs)[number][]>();
  for (const s of subs) {
    const list = subsByUser.get(s.userId) ?? [];
    list.push(s);
    subsByUser.set(s.userId, list);
  }
  for (const u of all) {
    let effective: PlanKey = "free";
    const override = isPlanKey(u.override) ? u.override : null;
    if (override) {
      effective = override;
    } else {
      const userSubs = subsByUser.get(u.id) ?? [];
      const entitled = userSubs.filter((s) => ENTITLED_STATUSES.has(s.status));
      if (entitled.length > 0) {
        entitled.sort(
          (a, b) =>
            (b.currentPeriodEnd?.getTime() ?? 0) -
            (a.currentPeriodEnd?.getTime() ?? 0),
        );
        if (isPlanKey(entitled[0].planKey)) effective = entitled[0].planKey;
      }
    }
    result[effective] += 1;
  }
  return result;
}

export interface ListAuditEntriesInput {
  page?: number;
  userId?: string;
  resourceType?: string;
}

export interface ListAuditEntriesResult {
  rows: PlatformAuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated audit-log read. Filters by userId or resourceType when
 * supplied. Ordered newest-first; the table is indexed by PK only at
 * v1 scale (the createdAt sort uses a sequential scan), which is fine
 * until the row count grows past ~100K.
 */
export async function listAuditEntries(
  input: ListAuditEntriesInput = {},
): Promise<ListAuditEntriesResult> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = ADMIN_AUDIT_PAGE_SIZE;
  const conds = [];
  if (input.userId) conds.push(eq(platformAuditLog.userId, input.userId));
  if (input.resourceType)
    conds.push(eq(platformAuditLog.resourceType, input.resourceType));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(platformAuditLog)
    .where(where);

  const rows = await db
    .select()
    .from(platformAuditLog)
    .where(where)
    .orderBy(desc(platformAuditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total: total ?? 0, page, pageSize };
}

/** Recent audit entries for a single user. Used on the per-user detail page. */
export async function listRecentAuditEntriesForUser(
  userId: string,
  limit = 10,
): Promise<PlatformAuditLogEntry[]> {
  return db
    .select()
    .from(platformAuditLog)
    .where(eq(platformAuditLog.userId, userId))
    .orderBy(desc(platformAuditLog.createdAt))
    .limit(limit);
}
