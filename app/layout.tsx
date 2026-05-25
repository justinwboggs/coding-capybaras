import type { Metadata } from "next";

import { Toaster } from "@/platform/components/ui/sonner";
import {
  BORDER_RADIUS_REMS,
  getBranding,
  getBrandingExtended,
  type FontFamily,
} from "@/platform/lib/config";
import { getTier, tierMeets } from "@/platform/lib/tier";

import "./globals.css";

// Title comes from configured branding (configuration over code). Falls back
// to the default app name if platform_config is empty or unreachable.
export async function generateMetadata(): Promise<Metadata> {
  const { appName, tagline } = await getBranding();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title: appName,
    description: tagline || "A modern SaaS application.",
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

// Font stacks. Keep in sync with branding-preview.tsx's FONT_STACKS.
const FONT_STACKS: Record<FontFamily, string> = {
  system:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  inter:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  geist:
    "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

// Google Fonts CDN URLs for the remote-loaded options. Only the selected
// font's <link> is emitted — we don't preload all four.
const GOOGLE_FONT_LINKS: Partial<Record<FontFamily, string>> = {
  inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  geist:
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBrandingExtended();
  const {
    appName,
    logoUrl,
    primaryColor,
    backgroundColor,
    fontFamily,
    borderRadius,
    foregroundColor,
    mutedColor,
    accentColor,
    borderColor,
    headingFontFamily,
    fontScale,
    customCss,
  } = branding;
  const tier = getTier();
  const hasPro = tierMeets(tier, "pro");

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Build the :root override. L1+L2 tokens always apply; L3 token overrides
  // only when the tier permits AND the field is non-empty (empty ⇒ inherit
  // from globals.css fallback).
  const primaryHsl = hexToHsl(primaryColor);
  const bgHsl = hexToHsl(backgroundColor);
  const tokens: string[] = [];
  if (primaryHsl) tokens.push(`--primary:${primaryHsl}`, `--ring:${primaryHsl}`);
  if (bgHsl) tokens.push(`--background:${bgHsl}`);
  tokens.push(`--radius:${BORDER_RADIUS_REMS[borderRadius]}`);
  if (hasPro) {
    const fgHsl = foregroundColor ? hexToHsl(foregroundColor) : null;
    const mutedHsl = mutedColor ? hexToHsl(mutedColor) : null;
    const accentHsl = accentColor ? hexToHsl(accentColor) : null;
    const borderHsl = borderColor ? hexToHsl(borderColor) : null;
    if (fgHsl) tokens.push(`--foreground:${fgHsl}`);
    if (mutedHsl) tokens.push(`--muted:${mutedHsl}`);
    if (accentHsl) tokens.push(`--accent:${accentHsl}`);
    if (borderHsl)
      tokens.push(`--border:${borderHsl}`, `--input:${borderHsl}`);
  }

  // body font-family. Heading font cascades into :is(h1,h2,h3,h4,h5,h6).
  const bodyStack = FONT_STACKS[fontFamily];
  const headingStack =
    hasPro && headingFontFamily ? FONT_STACKS[headingFontFamily] : bodyStack;
  const safeScale =
    hasPro && Number.isFinite(fontScale) && fontScale >= 0.875 && fontScale <= 1.25
      ? fontScale
      : 1;
  const bodyRules = [
    `font-family:${bodyStack}`,
    safeScale !== 1 ? `font-size:${safeScale}rem` : null,
  ]
    .filter(Boolean)
    .join(";");
  const headingRules =
    headingStack !== bodyStack ? `font-family:${headingStack}` : null;
  const styleCss =
    `:root{${tokens.join(";")}}` +
    `body{${bodyRules}}` +
    (headingRules ? `:is(h1,h2,h3,h4,h5,h6){${headingRules}}` : "");

  // Custom CSS — Pro-gated. Injected verbatim into a separate <style> block
  // so a syntax error in user CSS doesn't corrupt our token rules. No
  // scoping is applied (documented in the form's help text); admin auth +
  // Pro tier is the security boundary.
  const customCssToInject = hasPro && customCss.trim() ? customCss : null;

  // Google Fonts <link> for the selected body font (and heading font if
  // different). Only emit links for fonts that are actually selected.
  const fontFamiliesToLoad = new Set<FontFamily>();
  if (GOOGLE_FONT_LINKS[fontFamily]) fontFamiliesToLoad.add(fontFamily);
  if (hasPro && headingFontFamily && GOOGLE_FONT_LINKS[headingFontFamily]) {
    fontFamiliesToLoad.add(headingFontFamily);
  }

  // WebSite + Organization JSON-LD. Values flow from configured branding —
  // tenants get working structured data without code changes. `description`
  // is intentionally omitted (no metaDescription config field yet); search
  // engines fall back to the <meta name="description"> generateMetadata
  // already emits. `logo` is only included when an admin has actually set
  // one (DEFAULT_BRANDING.logoUrl is "").
  //
  // Want SoftwareApplication / Product / FAQPage schema too? See
  // docs/extensions/json-ld-software-application.md (and adjacent patterns).
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
      <head>
        {Array.from(fontFamiliesToLoad).map((f) => (
          <link key={f} rel="stylesheet" href={GOOGLE_FONT_LINKS[f]!} />
        ))}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Brand tokens flow config → here. globals.css holds the static
            fallback; this :root override wins by later source order. */}
        <style
          dangerouslySetInnerHTML={{
            __html: styleCss,
          }}
        />
        {customCssToInject && (
          <style
            dangerouslySetInnerHTML={{
              __html: customCssToInject,
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
