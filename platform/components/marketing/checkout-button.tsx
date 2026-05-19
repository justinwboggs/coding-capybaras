"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createCheckoutAction } from "@/platform/pages/account/billing/actions";
import { Button, type ButtonProps } from "@/platform/components/ui/button";

// Used on the pricing page for signed-in users. Signed-out users get a plain
// Link to /sign-in instead — see PlanCta in app/(marketing)/pricing/page.tsx.
export function CheckoutButton({
  planKey,
  label,
  variant = "default",
}: {
  planKey: "pro" | "business";
  label: string;
  variant?: ButtonProps["variant"];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className="w-full"
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // On success the action redirects to Checkout; control only
          // returns here on the error path.
          const result = await createCheckoutAction(planKey);
          if (result?.error) {
            toast.error("Couldn't start checkout", {
              description: result.error,
            });
          }
        })
      }
    >
      {pending ? "Starting checkout…" : label}
    </Button>
  );
}
