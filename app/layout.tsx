import type { Metadata } from "next";

import { Toaster } from "@/platform/components/ui/sonner";
import { getBranding } from "@/platform/lib/config";

import "./globals.css";

// Title comes from configured branding (configuration over code). Falls back
// to the default app name if platform_config is empty or unreachable.
export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getBranding();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title: appName,
    description: "Ship a real, paying SaaS in a weekend.",
  };
}

// Convert a #RRGGBB hex to a shadcn-style "H S% L%" token string. Returns
// null if the hex can't be parsed, so the caller falls back to the static
// --primary defined in globals.css.
function hexToHsl(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appName, logoUrl, primaryColor } = await getBranding();
  const primaryHsl = hexToHsl(primaryColor);
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // WebSite + Organization JSON-LD. Values flow from configured branding —
  // tenants get working structured data without code changes. `description`
  // is intentionally omitted (no metaDescription config field yet); search
  // engines fall back to the <meta name="description"> generateMetadata
  // already emits. `logo` is only included when an admin has actually set
  // one (DEFAULT_BRANDING.logoUrl is "").
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: appName,
    url: siteUrl,
  };
  const organizationLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: appName,
    url: siteUrl,
  };
  if (logoUrl) organizationLd.logo = logoUrl;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Brand primary flows config → here. globals.css holds the static
            fallback; this :root override wins by later source order. */}
        {primaryHsl && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{--primary:${primaryHsl};--ring:${primaryHsl};}`,
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
