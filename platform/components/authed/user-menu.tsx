"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

import { signOutAction } from "@/platform/pages/_actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/platform/components/ui/dropdown-menu";

// User menu in the authed nav (top-right of every authed page, including the
// journey). The dropdown trigger is the user's email; click reveals the
// account-settings link + sign-out button.
//
// Rendered by app/(authed)/layout.tsx, which also wraps the journey routes —
// users mid-journey can sign out without leaving the flow.
export function UserMenu({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  function onSignOut() {
    startTransition(async () => {
      try {
        await signOutAction();
        // signOutAction redirects server-side to "/" — we shouldn't reach here.
      } catch (err) {
        // NEXT_REDIRECT is the normal success path; anything else is real.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        console.error("[user-menu] sign out failed", err);
        toast.error("Couldn't sign out — please refresh and try again.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground"
        aria-label="Account menu"
      >
        <span className="max-w-[180px] truncate">{email}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Signed in as
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/billing">
            <Settings className="size-4" />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            // Don't auto-close before the action fires — Radix closes after
            // onSelect by default; we need pending state on the toast path
            // when signOutAction fails. Closing on success doesn't matter
            // since we navigate away.
            event.preventDefault();
            onSignOut();
          }}
          disabled={pending}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
