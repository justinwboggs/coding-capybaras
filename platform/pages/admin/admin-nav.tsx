"use client";

import { type Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/platform/lib/utils";

const TABS: readonly { href: Route; label: string; exact: boolean }[] = [
  { href: "/admin" as Route, label: "Overview", exact: true },
  { href: "/admin/users" as Route, label: "Users", exact: false },
  { href: "/admin/audit-log" as Route, label: "Audit log", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
