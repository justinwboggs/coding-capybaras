import { type Route } from "next";
import { redirect } from "next/navigation";

import { requireAuth } from "@/platform/lib/auth";
import { getAllConfig, getBranding } from "@/platform/lib/config";
import { getOrCreateJourney } from "@/platform/lib/journey/queries";
import {
  getStageDef,
  getStageIndex,
  STAGE_KEYS,
  type JourneyData,
  type StageKey,
} from "@/platform/lib/journey/stages";

import { BrandingForm } from "../_components/branding-form";
import { DeployForm } from "../_components/deploy-form";
import { EmailForm } from "../_components/email-form";
import { FoundationForm } from "../_components/foundation-form";
import { LaunchPrepForm } from "../_components/launch-prep-form";
import { PaymentsForm } from "../_components/payments-form";
import { ProjectForm } from "../_components/project-form";

function isStageKey(s: string): s is StageKey {
  return (STAGE_KEYS as readonly string[]).includes(s);
}

interface PageProps {
  params: Promise<{ stage: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { stage } = await params;
  if (!isStageKey(stage)) return { title: "Journey — Platform" };
  return { title: `${getStageDef(stage).title} — Journey` };
}

export default async function JourneyStagePage({ params }: PageProps) {
  const { stage } = await params;
  if (!isStageKey(stage)) {
    redirect("/journey");
  }

  const user = await requireAuth();
  const journey = await getOrCreateJourney(user.id);

  // Gate "future" stages. The user can revisit any stage they've reached or
  // passed; anything further along is locked.
  const requestedIdx = getStageIndex(stage);
  const currentIdx = getStageIndex(journey.currentStage as StageKey);
  if (requestedIdx > currentIdx) {
    // Bounce them back to wherever they actually are. (?locked= so the next
    // page can choose to toast — for V1 we just silently redirect.)
    redirect(`/journey/${journey.currentStage}` as Route);
  }

  const data = (journey.data ?? {}) as JourneyData;

  switch (stage) {
    case "project":
      return (
        <ProjectForm initial={(data.project ?? {}) as never} />
      );
    case "foundation":
      return (
        <FoundationForm initial={(data.foundation ?? {}) as never} />
      );
    case "payments":
      return (
        <PaymentsForm initial={(data.payments ?? {}) as never} />
      );
    case "email":
      return <EmailForm initial={(data.email ?? {}) as never} />;
    case "branding": {
      // Branding's source-of-truth is platform_config, not journey.data —
      // hydrate the form from there so revisits show the live values.
      const branding = await getBranding();
      // tagline isn't part of getBranding()'s resolved shape — read it
      // straight from platform_config and coalesce a missing value to "".
      const savedTagline = (await getAllConfig())["branding.tagline"];
      return (
        <BrandingForm
          initial={{
            appName: branding.appName,
            primaryColor: branding.primaryColor,
            logoUrl: branding.logoUrl,
            tagline: typeof savedTagline === "string" ? savedTagline : "",
          }}
        />
      );
    }
    case "launch-prep":
      return (
        <LaunchPrepForm initial={(data["launch-prep"] ?? {}) as never} />
      );
    case "deploy":
      return <DeployForm initial={(data.deploy ?? {}) as never} />;
  }
}
