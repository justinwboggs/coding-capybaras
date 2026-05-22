"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Client-side preview of the branding values as the admin edits them. Reads
// the form's live values via props — nothing is persisted until Save.
export function BrandingPreview({
  appName,
  primaryColor,
  logoUrl,
}: {
  appName: string;
  primaryColor: string;
  logoUrl: string;
}) {
  // Track the specific URL that failed to load, so editing to a new URL
  // re-attempts the render instead of staying suppressed.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  // Only honor a complete, valid hex — a half-typed value falls back so the
  // preview never renders an invalid color.
  const color = HEX_RE.test(primaryColor) ? primaryColor : "#000000";
  const trimmedLogo = logoUrl.trim();
  const showLogo = trimmedLogo.length > 0 && brokenUrl !== trimmedLogo;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
        <CardDescription>
          Updates as you type. Nothing is saved until you hit Save branding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          {showLogo && (
            // Plain <img>, not next/image: an arbitrary admin-supplied URL
            // would otherwise need next.config remotePatterns. Admin-only.
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={trimmedLogo}
              alt=""
              className="size-9 rounded object-contain"
              onError={() => setBrokenUrl(trimmedLogo)}
            />
          )}
          <span className="text-xl font-semibold tracking-tight">
            {appName.trim() || "Your app name"}
          </span>
        </div>

        {/* Inline backgroundColor (not bg-primary) so the button reflects the
            edited, not-yet-saved color. */}
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white"
          style={{ backgroundColor: color }}
        >
          Primary button
        </button>

        <p className="text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
