import Link from "next/link";

import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { requireAuth } from "@/platform/lib/auth";
import { canAccess } from "@/platform/lib/billing";
import {
  INTEGRATION_CATEGORY_LABELS,
  INTEGRATION_REGISTRY,
} from "@/platform/lib/integrations/registry";

import { InstallInstructionsButton } from "./install-instructions-button";

export const metadata = { title: "Integrations — Configuration" };

export default async function IntegrationsConfigPage() {
  const user = await requireAuth(); // /config/layout.tsx already requireAdmin's
  const hasAccess = await canAccess(user.id, "integrations.access");

  const integrations = INTEGRATION_REGISTRY;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Curated, drop-in integrations for analytics, email, CRM, and more.
          {hasAccess
            ? " Click any integration to see install instructions."
            : " Unlocked with Pro — lifetime access to every integration we add."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <EmptyState hasAccess={hasAccess} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.key}
                name={integration.name}
                description={integration.description}
                category={INTEGRATION_CATEGORY_LABELS[integration.category]}
                logoUrl={integration.logoUrl}
                installInstructions={integration.installInstructions}
                locked={!hasAccess}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ hasAccess }: { hasAccess: boolean }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="text-sm font-medium">
        More integrations coming weekly.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAccess
          ? "Your Pro plan unlocks every integration as soon as it ships."
          : "Pro users get access automatically."}
      </p>
      {!hasAccess && (
        <Button asChild className="mt-4">
          <Link href="/pricing">Upgrade to Pro</Link>
        </Button>
      )}
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  category,
  logoUrl,
  installInstructions,
  locked,
}: {
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  installInstructions: string;
  locked: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-3 rounded-lg border p-4" +
        (locked ? " opacity-75" : "")
      }
    >
      <div className="flex items-start gap-3">
        {logoUrl && (
          // Plain <img> — adding next/image remotePatterns config is V1.5 work.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md border bg-background object-contain p-1"
          />
        )}
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight">{name}</h3>
          <p className="text-xs text-muted-foreground">{category}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-auto">
        {locked ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">Upgrade to Pro</Link>
          </Button>
        ) : (
          <InstallInstructionsButton
            name={name}
            instructions={installInstructions}
          />
        )}
      </div>
    </div>
  );
}
