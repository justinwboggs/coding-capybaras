"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/platform/components/ui/button";

import { generateEnvFileAction } from "../actions";

// "Download .env.local template" — wraps the server-action-generated text in
// a Blob, triggers a browser download via a temporary <a> + object URL, then
// revokes the URL. The download is the SAME static template for every user —
// the platform never collects real secrets, so there's nothing user-specific
// to leak.
export function EnvDownloadButton({
  variant = "outline",
  label = "Download .env.local template",
}: {
  variant?: ButtonProps["variant"];
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await generateEnvFileAction();
      if ("error" in result) {
        toast.error("Couldn't generate the file", {
          description: result.error,
        });
        return;
      }
      const blob = new Blob([result.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = ".env.local";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(".env.local template downloaded", {
        description:
          "Replace each placeholder with your real values, then run pnpm db:migrate.",
      });
    });
  }

  return (
    <Button type="button" variant={variant} onClick={onClick} disabled={pending}>
      <Download className="size-4" />
      {pending ? "Preparing…" : label}
    </Button>
  );
}
