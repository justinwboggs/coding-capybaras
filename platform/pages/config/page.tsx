import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";

const SECTIONS = [
  {
    href: "/config/branding",
    title: "Branding",
    description:
      "App name, primary color, and logo — shown across every page.",
  },
  {
    href: "/config/pricing",
    title: "Pricing",
    description: "Plan display names, amounts, intervals, and feature lists.",
  },
  {
    href: "/config/email-templates",
    title: "Email Templates",
    description: "Subject and body for every transactional email.",
  },
  {
    href: "/config/feature-flags",
    title: "Feature Flags",
    description: "Which features each plan tier unlocks via canAccess().",
  },
  {
    href: "/config/integrations",
    title: "Integrations",
    description:
      "Browse the integration marketplace. Pro users see full install instructions.",
  },
] as const;

export default function ConfigOverviewPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((section) => (
        <Link key={section.href} href={section.href} className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
