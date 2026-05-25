import Link from "next/link";

import { Mascot } from "@/platform/components/branding/mascot";
import { Button } from "@/platform/components/ui/button";
import { getBranding } from "@/platform/lib/config";

import { BuiltByCodingCapybaras } from "@/website/components/built-by-coding-capybaras";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appName, attribution } = await getBranding();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Mascot />
            {appName}
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span>&copy; {new Date().getFullYear()} {appName}</span>
            {attribution && <BuiltByCodingCapybaras />}
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/business/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
