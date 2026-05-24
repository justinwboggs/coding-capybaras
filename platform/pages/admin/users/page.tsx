import { type Route } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Badge } from "@/platform/components/ui/badge";
import { Button } from "@/platform/components/ui/button";
import { Input } from "@/platform/components/ui/input";
import {
  ADMIN_USERS_PAGE_SIZE,
  listUsers,
} from "@/platform/lib/admin/queries";
import { type PlanKey } from "@/platform/lib/billing";
import { getTier, tierMeets } from "@/platform/lib/tier";
import { cn } from "@/platform/lib/utils";

export const metadata = { title: "Users — Admin" };

type TierFilter = PlanKey | "all";

const TIER_FILTERS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "business", label: "Business" },
];

const PLAN_LABEL: Record<PlanKey, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

interface PageProps {
  searchParams: Promise<{ q?: string; tier?: string; page?: string }>;
}

// Pure server component — no client JS for the table itself. Search uses a
// GET form, tier filters are <Link>s, pagination is prev/next <Link>s.
// Per-row click navigates to /admin/users/[id] where the interactive
// actions live (cancel/override/delete).
export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const tier = isTierFilter(sp.tier) ? sp.tier : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { rows, total, pageSize } = await listUsers({
    q: q || undefined,
    tier: tier === "all" ? undefined : tier,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const platformTier = getTier();
  const hasPro = tierMeets(platformTier, "pro");

  return (
    <div className="space-y-6">
      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="get" className="flex items-center gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by email…"
            className="w-64"
          />
          {tier !== "all" && (
            <input type="hidden" name="tier" value={tier} />
          )}
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-1">
          {TIER_FILTERS.map((f) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value !== "all") params.set("tier", f.value);
            const href = params.toString()
              ? `/admin/users?${params.toString()}`
              : "/admin/users";
            const active = tier === f.value;
            return (
              <Link
                key={f.value}
                href={href as Route}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Locked bulk-ops placeholder — Pro-only */}
        <div className="ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="gap-1.5"
            title={
              hasPro
                ? "Bulk operations implementation coming in a follow-up tranche."
                : "Bulk operations are a Pro feature. Set PLATFORM_TIER=pro to unlock."
            }
          >
            <Lock className="size-3" />
            Bulk actions
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {hasPro ? "Soon" : "Pro"}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Tier</th>
              <th className="px-4 py-2 text-left font-medium">Joined</th>
              <th className="px-4 py-2 text-left font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No users match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-b-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/users/${u.id}` as Route}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary" className="text-xs">
                      {PLAN_LABEL[u.effectiveTier]}
                    </Badge>
                    {u.isOverride && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (override)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">
                    {u.isAdmin ? (
                      <Badge className="text-xs">Admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + count */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          {total === 0
            ? "0 users"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                total,
              )} of ${total.toLocaleString()}`}
        </div>
        <div className="flex items-center gap-2">
          <PageLink
            label="← Prev"
            page={page - 1}
            disabled={page <= 1}
            q={q}
            tier={tier}
          />
          <span className="text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <PageLink
            label="Next →"
            page={page + 1}
            disabled={page >= totalPages}
            q={q}
            tier={tier}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {ADMIN_USERS_PAGE_SIZE} per page. Click an email to view the
        user&apos;s subscription, audit history, and admin actions.
      </p>
    </div>
  );
}

function PageLink({
  label,
  page,
  disabled,
  q,
  tier,
}: {
  label: string;
  page: number;
  disabled: boolean;
  q: string;
  tier: TierFilter;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border px-3 py-1 text-xs text-muted-foreground opacity-50">
        {label}
      </span>
    );
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tier !== "all") params.set("tier", tier);
  if (page > 1) params.set("page", String(page));
  const href = params.toString()
    ? `/admin/users?${params.toString()}`
    : "/admin/users";
  return (
    <Link
      href={href as Route}
      className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent"
    >
      {label}
    </Link>
  );
}

function isTierFilter(v: string | undefined): v is TierFilter {
  return (
    v === "all" || v === "free" || v === "pro" || v === "business"
  );
}
