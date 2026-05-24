import { Lock } from "lucide-react";

import { Badge } from "@/platform/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import {
  countByTier,
  countNewUsersSince,
  countUsers,
} from "@/platform/lib/admin/queries";
import { getTier, tierMeets } from "@/platform/lib/tier";

export const metadata = { title: "Overview — Admin" };

// Free-tier metrics tiles + Pro-locked advanced-analytics placeholder.
// Server component; all four counts come from listUsers' resolution logic
// applied in admin/queries.ts (override > subscription > free).
export default async function AdminOverviewPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, last7d, last30d, byTier] = await Promise.all([
    countUsers(),
    countNewUsersSince(sevenDaysAgo),
    countNewUsersSince(thirtyDaysAgo),
    countByTier(),
  ]);

  const tier = getTier();
  const hasPro = tierMeets(tier, "pro");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Total users" value={total.toLocaleString()} />
        <MetricTile label="New (7d)" value={last7d.toLocaleString()} />
        <MetricTile label="New (30d)" value={last30d.toLocaleString()} />
        <Card>
          <CardHeader>
            <CardDescription>By tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Free" value={byTier.free.toLocaleString()} />
            <Row label="Pro" value={byTier.pro.toLocaleString()} />
            <Row label="Business" value={byTier.business.toLocaleString()} />
          </CardContent>
        </Card>
      </div>

      {/* Pro-locked: advanced analytics placeholder */}
      <Card className={hasPro ? undefined : "opacity-70"}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Advanced analytics</CardTitle>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              {hasPro ? "Unlocked" : <Lock className="size-3" />}
              {hasPro ? null : "Pro"}
            </Badge>
          </div>
          <CardDescription>
            Cohort retention, signups over time, and conversion funnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPro ? (
            <p className="text-sm text-muted-foreground">
              Chart implementation coming in a follow-up tranche — the tier
              gate is live, the data plumbing is the next piece.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set <code>PLATFORM_TIER=pro</code> in your env to unlock the
              full analytics dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
