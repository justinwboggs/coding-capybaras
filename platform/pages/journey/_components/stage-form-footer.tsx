"use client";

import { Button } from "@/platform/components/ui/button";

// Shared two-button footer for every stage form. The "Save and continue
// later" path is a plain handler (the form's own onSaveOnly with the lax
// schema). The "Continue" path is the form's submit (strict schema → action
// → redirect to next stage on success).
//
// `continueDisabled` gates the Continue button on the client — used by the
// attestation stages to keep "Continue" off until every checkbox is ticked.
// Server-side validation re-enforces this; the prop is purely UX.
export function StageFormFooter({
  onSaveOnly,
  saving,
  submitting,
  continueLabel = "Continue to next stage",
  continueDisabled = false,
}: {
  onSaveOnly: () => void;
  saving: boolean;
  submitting: boolean;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  const busy = saving || submitting;
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onSaveOnly}
        disabled={busy}
      >
        {saving ? "Saving…" : "Save and continue later"}
      </Button>
      <Button type="submit" disabled={busy || continueDisabled}>
        {submitting ? "Saving…" : continueLabel}
      </Button>
    </div>
  );
}
