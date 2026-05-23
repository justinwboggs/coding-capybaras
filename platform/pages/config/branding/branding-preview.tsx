"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import {
  BORDER_RADIUS_REMS,
  type BorderRadius,
  type FontFamily,
} from "@/platform/lib/config";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Font stacks the preview applies inline. layout.tsx mirrors these when
// it sets font-family on body — keep the two in sync.
const FONT_STACKS: Record<FontFamily, string> = {
  system:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  inter:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  geist:
    "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

// Client-side preview of the branding values as the admin edits them. Reads
// the form's live values via props — nothing is persisted until Save. L3
// fields (token overrides, heading font, font scale) apply as inline styles
// scoped to this Card's content so they don't leak into the rest of /config.
// Custom CSS is intentionally NOT previewed (scoping arbitrary CSS to a
// region is unreliable); a note tells the admin when one is set.
export function BrandingPreview({
  appName,
  primaryColor,
  logoUrl,
  backgroundColor,
  fontFamily,
  borderRadius,
  foregroundColor,
  mutedColor,
  accentColor,
  borderColor,
  headingFontFamily,
  fontScale,
  hasCustomCss,
}: {
  appName: string;
  primaryColor: string;
  logoUrl: string;
  backgroundColor: string;
  fontFamily: FontFamily;
  borderRadius: BorderRadius;
  foregroundColor: string;
  mutedColor: string;
  accentColor: string;
  borderColor: string;
  headingFontFamily: FontFamily | "";
  fontScale: number;
  hasCustomCss: boolean;
}) {
  // Track the specific URL that failed to load, so editing to a new URL
  // re-attempts the render instead of staying suppressed.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  // Only honor a complete, valid hex — a half-typed value falls back so the
  // preview never renders an invalid color.
  const color = HEX_RE.test(primaryColor) ? primaryColor : "#000000";
  const bg = HEX_RE.test(backgroundColor) ? backgroundColor : "#ffffff";
  const fg = HEX_RE.test(foregroundColor) ? foregroundColor : null;
  const muted = HEX_RE.test(mutedColor) ? mutedColor : null;
  const accent = HEX_RE.test(accentColor) ? accentColor : null;
  const borderHex = HEX_RE.test(borderColor) ? borderColor : null;
  const trimmedLogo = logoUrl.trim();
  const showLogo = trimmedLogo.length > 0 && brokenUrl !== trimmedLogo;
  const radiusRem = BORDER_RADIUS_REMS[borderRadius];
  const bodyStack = FONT_STACKS[fontFamily];
  const headingStack = headingFontFamily
    ? FONT_STACKS[headingFontFamily]
    : bodyStack;
  const safeScale =
    Number.isFinite(fontScale) && fontScale >= 0.875 && fontScale <= 1.25
      ? fontScale
      : 1;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
        <CardDescription>
          Updates as you type. Nothing is saved until you hit Save branding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-5 rounded-md p-5"
          style={{
            backgroundColor: bg,
            color: fg ?? undefined,
            fontFamily: bodyStack,
            fontSize: `${safeScale}rem`,
            borderRadius: radiusRem,
            border: borderHex ? `1px solid ${borderHex}` : "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center gap-3">
            {showLogo && (
              // Plain <img>, not next/image: an arbitrary admin-supplied URL
              // would otherwise need next.config remotePatterns. Admin-only.
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={trimmedLogo}
                alt=""
                className="size-9 object-contain"
                style={{ borderRadius: radiusRem }}
                onError={() => setBrokenUrl(trimmedLogo)}
              />
            )}
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: headingStack }}
            >
              {appName.trim() || "Your app name"}
            </span>
          </div>

          {/* Inline backgroundColor (not bg-primary) so the button reflects
              the edited, not-yet-saved color. */}
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-white"
            style={{ backgroundColor: color, borderRadius: radiusRem }}
          >
            Primary button
          </button>

          <p style={{ color: muted ?? "#6b7280" }}>
            Here&apos;s a{" "}
            <a
              href="#"
              style={{ color }}
              className="font-medium underline underline-offset-2"
            >
              styled link
            </a>{" "}
            in your primary color.
          </p>

          {accent && (
            <div
              className="px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: accent,
                borderRadius: radiusRem,
                color: fg ?? undefined,
              }}
            >
              Accent block
            </div>
          )}
        </div>

        {hasCustomCss && (
          <p className="mt-4 text-xs text-muted-foreground">
            Custom CSS applies on next page load — preview omitted to avoid
            scoping issues.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
