"use client";

import { type Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Circle, Lock } from "lucide-react";

import type { PlatformJourney } from "@/platform/db/schema/platform";
import {
  getStageIndex,
  isStageComplete,
  STAGES,
  type JourneyData,
  type StageKey,
} from "@/platform/lib/journey/stages";
import { cn } from "@/platform/lib/utils";

// Stage list with three visual states:
//   completed — green check, navigable (revisit / edit)
//   active    — primary ring + bold, navigable (current stage)
//   locked    — muted lock icon, NOT navigable (toast on click)
//
// A stage is locked if any earlier stage isn't complete, OR if it's past the
// user's furthest-reached `currentStage`. Both conditions collapse to the
// same gating rule.
//
// `isFree` adds an upgrade nudge below the list for Free users — mid-journey
// upgrades are a real path (the marketplace is a Pro tier perk), and the
// billing gate exception in /account/billing is the matching backend change.
export function JourneySidebar({
  journey,
  isFree,
}: {
  journey: PlatformJourney;
  isFree: boolean;
}) {
  const pathname = usePathname();
  const data = (journey.data ?? {}) as JourneyData;
  const currentStage = journey.currentStage as StageKey;
  const currentIdx = getStageIndex(currentStage);

  return (
    <nav aria-label="Journey stages" className="space-y-4">
      <div className="space-y-1">
      {STAGES.map((stage, i) => {
        const complete = isStageComplete(stage.key, data[stage.key]);
        const isCurrent = stage.key === currentStage;
        const isPast = i < currentIdx;
        const locked = !complete && !isCurrent && !isPast;
        const active = pathname === `/journey/${stage.key}`;

        const Icon = complete ? Check : locked ? Lock : Circle;

        const inner = (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active && "bg-accent",
              locked
                ? "cursor-not-allowed text-muted-foreground/60"
                : "hover:bg-accent text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                complete && "text-primary",
                locked && "text-muted-foreground/60",
                !complete && !locked && "text-muted-foreground",
              )}
            />
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate font-medium",
                  isCurrent && "text-foreground",
                )}
              >
                {i + 1}. {stage.title}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                ~{stage.estimatedMinutes} min
              </div>
            </div>
          </div>
        );

        if (locked) {
          return (
            <div
              key={stage.key}
              title="Complete earlier stages first"
              aria-disabled
            >
              {inner}
            </div>
          );
        }
        return (
          <Link
            key={stage.key}
            href={`/journey/${stage.key}` as Route}
          >
            {inner}
          </Link>
        );
      })}
      </div>

      {isFree && (
        <div className="rounded-md border border-dashed p-3 text-xs">
          <div className="font-medium text-foreground">Free plan</div>
          <p className="mt-1 text-muted-foreground">
            Pro unlocks the integration marketplace and priority support — one
            payment, lifetime access.
          </p>
          <Link
            href="/pricing"
            className="mt-2 inline-block text-primary underline underline-offset-2"
          >
            View Pro pricing →
          </Link>
        </div>
      )}
    </nav>
  );
}
