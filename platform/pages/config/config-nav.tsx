"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/platform/lib/utils";

const TABS = [
  { href: "/config/branding", label: "Branding" },
  { href: "/config/pricing", label: "Pricing" },
  { href: "/config/email-templates", label: "Email Templates" },
  { href: "/config/feature-flags", label: "Feature Flags" },
  { href: "/config/integrations", label: "Integrations" },
] as const;

export function ConfigNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
