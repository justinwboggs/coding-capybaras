import { type Route } from "next";
import Link from "next/link";

import { SupportButton } from "@/platform/components/authed/support-button";
import { UpdatesButton } from "@/platform/components/authed/updates-button";
import { UserMenu } from "@/platform/components/authed/user-menu";
import { Mascot } from "@/platform/components/branding/mascot";
import { isAdmin, requireAuth } from "@/platform/lib/auth";
import { canAccess } from "@/platform/lib/billing";
import { getBranding } from "@/platform/lib/config";
import {
  CURRENT_VERSION,
  getUnseenChanges,
  updatePromptForUser,
} from "@/platform/lib/version";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { appName } = await getBranding();

  // Pro-gated nav signals. canAccess is server-only + request-cached, so these
  // two calls plus the layout's branding read stay cheap.
  const canSupport = await canAccess(user.id, "support.priority");
  const canUpdates = await canAccess(user.id, "updates.notifications");

  // Show the "Update available" indicator only for Pro users whose
  // last_seen_version is behind CURRENT_VERSION.
  const meta = (user.metadata ?? {}) as Record<string, unknown>;
  const lastSeen =
    typeof meta.last_seen_version === "string" ? meta.last_seen_version : null;
  const unseen =
    canUpdates && lastSeen !== CURRENT_VERSION ? getUnseenChanges(lastSeen) : [];
  const showUpdates = canUpdates && unseen.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Mascot />
            {appName}
          </Link>
          <div className="flex items-center gap-4">
            {showUpdates && (
              <UpdatesButton
                currentVersion={CURRENT_VERSION}
                unseen={unseen}
                updatePrompt={updatePromptForUser(lastSeen)}
              />
            )}
            <SupportButton isPro={canSupport} />
            {/* COPY_TODO: review tone — Tranche 11c-1: cross-surface nav back
                to the Stage 0 install tutorial. Visible to every authed user
                regardless of plan, journey stage, or role. The destination
                renders with marketing chrome by design — docs are a global
                reference, not part of the dashboard surface. */}
            <Link
              href="/docs"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            {isAdmin(user) && (
              <Link
                href="/config"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Config
              </Link>
            )}
            {isAdmin(user) && (
              <Link
                href={"/admin" as Route}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <Link
              href="/account/billing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Billing
            </Link>
            <UserMenu email={user.email} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
