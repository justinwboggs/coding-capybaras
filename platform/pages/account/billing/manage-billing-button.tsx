"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/platform/components/ui/button";

import { openBillingPortalAction } from "./actions";

export function ManageBillingButton({
  label = "Manage billing",
  variant = "outline",
  className,
}: {
  label?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // On success the action redirects to the billing portal; control
          // only returns here on the error path.
          const result = await openBillingPortalAction();
          if (result?.error) {
            toast.error("Couldn't open billing portal", {
              description: result.error,
            });
          }
        })
      }
    >
      {pending ? "Opening…" : label}
    </Button>
  );
}
