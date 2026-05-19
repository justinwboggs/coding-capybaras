"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { acknowledgeUpdateAction } from "@/platform/pages/_actions/updates";
import { Badge } from "@/platform/components/ui/badge";
import { Button } from "@/platform/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/platform/components/ui/dialog";
import type { ChangelogEntry } from "@/platform/lib/version";

export function UpdatesButton({
  currentVersion,
  unseen,
  updatePrompt,
}: {
  currentVersion: string;
  unseen: ChangelogEntry[];
  updatePrompt: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Marks the current version as seen and closes the modal on success. Called
  // by BOTH the primary button AND any other close path (X, Escape, overlay
  // click) — see handleOpenChange below. The user just saw the changelog, so
  // every close path is treated as "acknowledged" (per the Tranche 9 review).
  function acknowledgeAndClose() {
    startTransition(async () => {
      const result = await acknowledgeUpdateAction();
      if ("error" in result) {
        toast.error("Couldn't acknowledge", { description: result.error });
        return; // leave the modal open so they can retry
      }
      toast.success("You're caught up");
      setOpen(false);
    });
  }

  // Intercept every close attempt (X / Escape / overlay click) and route it
  // through acknowledgeAndClose. While the server action is pending, ignore
  // further close attempts so the modal can't be dismissed mid-flight.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    if (!pending) {
      acknowledgeAndClose();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        title="Platform updates available"
      >
        <Badge>Update</Badge>
        <span className="hidden sm:inline">available</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>What&apos;s new in v{currentVersion}</DialogTitle>
            <DialogDescription>
              Changes since you last checked in. Pro tier — early notice on every
              release.
            </DialogDescription>
          </DialogHeader>

          {/* min-w-0 keeps long unbreakable strings (e.g. the Claude Code prompt
              below) from stretching the DialogContent grid track wider than the
              max-w-2xl cap. Without it, grid items default to min-width: auto
              and grow to fit min-content. */}
          <div className="min-w-0 space-y-5">
            {unseen.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold">v{entry.version}</h3>
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="text-muted-foreground">
                      — {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">
                Pull these changes into your project
              </p>
              <p className="text-xs text-muted-foreground">
                Copy this into Claude Code (or Cursor) inside your project repo.
                It targets the platform layer only — your product code is
                untouched.
              </p>
              <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                {updatePrompt}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={acknowledgeAndClose}
              disabled={pending}
            >
              {pending ? "Saving…" : "Got it — I'll update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
