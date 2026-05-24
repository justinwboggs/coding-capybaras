"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/platform/components/ui/badge";
import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/platform/components/ui/dialog";
import { Input } from "@/platform/components/ui/input";
import { Label } from "@/platform/components/ui/label";
import { tierMeets, type Tier } from "@/platform/lib/tier/predicates";

import {
  cancelSubscriptionAction,
  deleteUserAction,
  setManualPlanOverrideAction,
} from "../../actions";

// Three admin actions for a single user. All state is local — this is
// the only client component on the user detail page. Tier prop is
// passed from the server parent (boundary discipline: tierMeets comes
// from the client-safe predicates module, not from the server-only
// tier index).
type OverrideValue = "free" | "pro" | "business" | "none";

export function UserActions({
  userId,
  userEmail,
  currentOverride,
  hasSubscription,
  tier,
}: {
  userId: string;
  userEmail: string;
  currentOverride: "free" | "pro" | "business" | null;
  hasSubscription: boolean;
  tier: Tier;
}) {
  const router = useRouter();
  const [overrideValue, setOverrideValue] = useState<OverrideValue>(
    currentOverride ?? "none",
  );
  const [savingOverride, startSavingOverride] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [canceling, startCanceling] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, startDeleting] = useTransition();

  const hasPro = tierMeets(tier, "pro");
  const overrideDirty = (currentOverride ?? "none") !== overrideValue;

  function saveOverride() {
    startSavingOverride(async () => {
      const result = await setManualPlanOverrideAction({
        userId,
        override: overrideValue === "none" ? null : overrideValue,
      });
      if (result && "error" in result) {
        toast.error("Couldn't update override", { description: result.error });
        return;
      }
      toast.success(
        overrideValue === "none"
          ? "Override cleared — entitlement falls back to subscription."
          : `Override set to ${overrideValue}.`,
      );
      router.refresh();
    });
  }

  function confirmCancel() {
    startCanceling(async () => {
      const result = await cancelSubscriptionAction({
        userId,
        atPeriodEnd: cancelAtPeriodEnd,
      });
      if (result && "error" in result) {
        toast.error("Couldn't cancel subscription", {
          description: result.error,
        });
        return;
      }
      toast.success(
        cancelAtPeriodEnd
          ? "Cancel scheduled at period end."
          : "Subscription canceled immediately.",
      );
      setCancelOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteUserAction({ userId, confirmEmail });
      if (result && "error" in result) {
        toast.error("Couldn't delete user", { description: result.error });
        return;
      }
      toast.success("User deleted.");
      setDeleteOpen(false);
      router.push("/admin/users");
    });
  }

  return (
    <div className="space-y-6">
      {/* Override */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual tier override</CardTitle>
          <CardDescription>
            Force a tier without touching Stripe. Use sparingly — comp grants,
            internal access, friends-and-family. Clearing returns entitlement
            to the user&apos;s subscription state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["none", "free", "pro", "business"] as const).map((opt) => (
              <Label
                key={opt}
                className="flex items-center gap-2 rounded-md border p-2 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent"
              >
                <input
                  type="radio"
                  name="override"
                  value={opt}
                  checked={overrideValue === opt}
                  onChange={() => setOverrideValue(opt)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-sm capitalize">
                  {opt === "none" ? "No override" : opt}
                </span>
              </Label>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={saveOverride}
            disabled={!overrideDirty || savingOverride}
          >
            {savingOverride ? "Saving…" : "Save override"}
          </Button>
        </CardContent>
      </Card>

      {/* Cancel subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription>
            Cancel the user&apos;s active subscription. The webhook syncs the
            new state back; the user&apos;s entitlement updates on the next
            page load.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCancelOpen(true)}
            disabled={!hasSubscription}
          >
            Cancel subscription
          </Button>
          {!hasSubscription && (
            <p className="mt-2 text-xs text-muted-foreground">
              This user has no active subscription on the current provider.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Locked: custom fields (Pro placeholder) */}
      <Card className={hasPro ? undefined : "opacity-70"}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Custom fields</CardTitle>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              {hasPro ? "Unlocked" : <Lock className="size-3" />}
              {hasPro ? null : "Pro"}
            </Badge>
          </div>
          <CardDescription>
            Tenant-defined attributes on user records (industry, company size,
            referral source, …).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasPro
              ? "Schema flexibility coming in a follow-up tranche."
              : "Set PLATFORM_TIER=pro in your env to unlock."}
          </p>
        </CardContent>
      </Card>

      {/* Delete user — destructive */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Delete user
          </CardTitle>
          <CardDescription>
            Removes the user from auth and cascades through every platform
            table (subscriptions, payment customers, journey, audit user-ref).
            The audit log row itself survives with the deleted user&apos;s id
            preserved for the trail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              setConfirmEmail("");
              setDeleteOpen(true);
            }}
          >
            Delete this user…
          </Button>
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              The webhook syncs the canceled state back from the provider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="flex items-start gap-2 rounded-md border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent">
              <input
                type="radio"
                name="cancel-mode"
                checked={cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(true)}
                className="mt-1 h-3.5 w-3.5 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">At period end</span>
                <br />
                <span className="text-muted-foreground">
                  User keeps access until the current billing period ends.
                </span>
              </span>
            </Label>
            <Label className="flex items-start gap-2 rounded-md border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-accent">
              <input
                type="radio"
                name="cancel-mode"
                checked={!cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(false)}
                className="mt-1 h-3.5 w-3.5 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">Immediately</span>
                <br />
                <span className="text-muted-foreground">
                  Access ends right now. No proration.
                </span>
              </span>
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={canceling}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmCancel}
              disabled={canceling}
            >
              {canceling ? "Canceling…" : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete user permanently?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone. Type the user&apos;s email to confirm:{" "}
              <code className="font-mono">{userEmail}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-email">Confirm email</Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={userEmail}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={
                deleting ||
                confirmEmail.trim().toLowerCase() !==
                  userEmail.trim().toLowerCase()
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
