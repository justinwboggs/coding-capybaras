"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

// A monospace code block with a "Copy" button in the top-right. Used in the
// instructional stages (payments / email) to hand users the env template they
// paste into their own .env.local — secrets stay on their machine, never
// round-trip through our server.
export function CopyableCodeBlock({ code, label = "Copy" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select the text manually instead.");
    }
  }

  return (
    <div className="relative rounded-md border bg-muted/40">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : label}
        className="absolute right-2 top-2 flex items-center gap-1 rounded border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : label}
      </button>
      {/* whitespace-pre preserves the template's intentional line breaks;
          overflow-x-auto scrolls long lines (e.g. the DATABASE_URL template). */}
      <pre className="overflow-x-auto whitespace-pre p-4 pr-20 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
