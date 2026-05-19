"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/platform/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/platform/components/ui/dialog";

import { skipJourneyAction } from "../actions";

// "Skip journey" — always available in the top-right. Confirmation modal is
// non-destructive by default (focus lands on Cancel) so accidental clicks
// don't wipe the guided experience.
export function SkipButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmSkip() {
    startTransition(async () => {
      const result = await skipJourneyAction();
      if (result && "error" in result) {
        toast.error("Couldn't skip", { description: result.error });
      }
      // Success path redirects to /dashboard — nothing to do here.
    });
  }

  return (
    <>
      {/* Subordinate to the stage heading: small, muted, link-styled rather
          than button-styled. The confirmation dialog (below) still has full
          chrome — this is only the trigger. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md text-sm font-normal text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Skip journey
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip the journey?</DialogTitle>
            <DialogDescription>
              The journey is genuinely useful even if you&apos;ve done this
              before — it captures the secrets and copy you&apos;ll need anyway.
              Skipping marks it complete and drops you on the dashboard. You
              can always come back to <code>/config</code> for the same edits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="default"
              autoFocus
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={confirmSkip}
              disabled={pending}
            >
              {pending ? "Skipping…" : "Skip anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
