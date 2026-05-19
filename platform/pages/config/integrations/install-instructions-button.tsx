"use client";

import { useState } from "react";

import { Button } from "@/platform/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/platform/components/ui/dialog";

/**
 * Opens a modal with an integration's install instructions. Instructions are
 * stored as plain text in the registry for V1 — a markdown renderer can be
 * dropped in here later if/when integrations ship structured content. The
 * <pre className="whitespace-pre-wrap"> preserves intentional line breaks and
 * code-block indentation.
 */
export function InstallInstructionsButton({
  name,
  instructions,
}: {
  name: string;
  instructions: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        View installation
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Install {name}</DialogTitle>
            <DialogDescription>
              Follow these steps inside your project repo.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
            {instructions}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
