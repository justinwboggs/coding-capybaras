import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/platform/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { db } from "@/platform/db/client";
import { platformUsers } from "@/platform/db/schema/platform";
import { listRecentAuditEntriesForUser } from "@/platform/lib/admin/queries";
import {
  getUserPaymentCustomer,
  getUserPlan,
  getUserSubscription,
  type PlanKey,
} from "@/platform/lib/billing";
import { getTier } from "@/platform/lib/tier";

import { UserActions } from "./_components/user-actions";

export const metadata = { title: "User — Admin" };

const PLAN_LABEL: Record<PlanKey, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Validate the id — Drizzle will surface a 22P02 from postgres if the
  // UUID is malformed; surface a 404 instead.
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) notFound();

  const [user] = await db
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.id, id))
    .limit(1);
  if (!user) notFound();

  const [effectiveTier, subscription, paymentCustomer, recentAudit] =
    await Promise.all([
      getUserPlan(user.id),
      getUserSubscription(user.id),
      getUserPaymentCustomer(user.id),
      listRecentAuditEntriesForUser(user.id, 10),
    ]);

  const override =
    user.manualPlanOverride === "free" ||
    user.manualPlanOverride === "pro" ||
    user.manualPlanOverride === "business"
      ? user.manualPlanOverride
      : null;
  const hasActiveSubscription =
    !!subscription && subscription.status !== "canceled";
  const platformTier = getTier();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Users
        </Link>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{user.email}</CardTitle>
          <CardDescription>
            User id <code className="font-mono">{user.id}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Effective tier"
            value={
              <span className="flex items-center gap-2">
                <Badge>{PLAN_LABEL[effectiveTier]}</Badge>
                {override && (
                  <span className="text-xs text-muted-foreground">
                    via override
                  </span>
                )}
              </span>
            }
          />
          <Field label="Joined" value={user.createdAt.toISOString().slice(0, 10)} />
          <Field label="Role" value={user.isAdmin ? "Admin" : "Member"} />
        </CardContent>
      </Card>

      {/* Subscription state */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Field label="Plan" value={PLAN_LABEL[subscription.planKey as PlanKey] ?? subscription.planKey} />
              <Field
                label="Status"
                value={
                  <Badge variant="secondary" className="capitalize">
                    {subscription.status}
                  </Badge>
                }
              />
              <Field
                label="Period ends"
                value={
                  subscription.currentPeriodEnd
                    ? subscription.currentPeriodEnd
                        .toISOString()
                        .slice(0, 10)
                    : "—"
                }
              />
              <Field
                label="Cancel at period end"
                value={subscription.cancelAtPeriodEnd ? "Yes" : "No"}
              />
              <Field label="Provider" value={subscription.provider} />
              <Field
                label="External id"
                value={
                  <code className="font-mono text-xs">
                    {subscription.externalId}
                  </code>
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subscription on record.
              {paymentCustomer
                ? " (Customer exists but has never completed checkout.)"
                : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <UserActions
        userId={user.id}
        userEmail={user.email}
        currentOverride={override}
        hasSubscription={hasActiveSubscription}
        tier={platformTier}
      />

      {/* Recent audit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>
            Last 10 audit entries for this user. The full log lives at{" "}
            <Link
              href="/admin/audit-log"
              className="underline underline-offset-2"
            >
              /admin/audit-log
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-baseline gap-x-3 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <code className="font-mono text-xs">{row.action}</code>
                  <span className="text-xs text-muted-foreground">
                    {row.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
