"use client";

import { usePathname } from "next/navigation";

import type { PlatformJourney } from "@/platform/db/schema/platform";
import {
  completionFraction,
  getStageDef,
  getStageIndex,
  STAGES,
  type JourneyData,
  type StageKey,
} from "@/platform/lib/journey/stages";

import { SkipButton } from "./skip-button";

// Top-of-page progress strip. Reads the current pathname to figure out which
// stage the user is on (so "Stage 2 of 7: Payments" tracks where you are,
// not where the journey thinks it's at).
export function ProgressHeader({ journey }: { journey: PlatformJourney }) {
  const pathname = usePathname();
  const onStage = pathnameStage(pathname);

  const data = (journey.data ?? {}) as JourneyData;
  const fraction = completionFraction(data);
  const pct = Math.round(fraction * 100);

  const stage = onStage ? getStageDef(onStage) : null;
  const stageNumber = onStage ? getStageIndex(onStage) + 1 : null;

  return (
    <header className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {stage && stageNumber !== null ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stage {stageNumber} of {STAGES.length} · ~{stage.estimatedMinutes} min · {pct}%
                complete
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{stage.title}</h1>
              <p className="text-muted-foreground">{stage.description}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Journey · {pct}% complete
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Let&apos;s ship it.</h1>
            </>
          )}
        </div>
        <SkipButton />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </header>
  );
}

function pathnameStage(pathname: string): StageKey | null {
  const match = pathname.match(/^\/journey\/([^/]+)/);
  if (!match) return null;
  const candidate = match[1] as StageKey;
  return STAGES.some((s) => s.key === candidate) ? candidate : null;
}
