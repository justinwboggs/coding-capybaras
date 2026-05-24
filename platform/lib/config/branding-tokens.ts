// Branding token primitives shared by server (config/index.ts) and client
// (branding-preview, plus future client surfaces). Lives in its own file
// because /platform/lib/config/index.ts is marked "server-only", and client
// components can't pull values across that boundary — only types get
// stripped. These constants are pure data with no runtime DB reads, so they
// are safe to import from anywhere. config/index.ts re-exports them so
// server callers can keep importing from "@/platform/lib/config".

/** Font family presets the GUI offers. "system" / "serif" are CSS stacks
 *  with no remote load; "inter" / "geist" trigger a Google Fonts <link>. */
export type FontFamily = "system" | "inter" | "geist" | "serif";
export const FONT_FAMILIES: readonly FontFamily[] = [
  "system",
  "inter",
  "geist",
  "serif",
] as const;

/** Border radius presets. Maps to --radius via BORDER_RADIUS_REMS. */
export type BorderRadius = "none" | "sm" | "md" | "lg";
export const BORDER_RADII: readonly BorderRadius[] = [
  "none",
  "sm",
  "md",
  "lg",
] as const;
export const BORDER_RADIUS_REMS: Record<BorderRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.875rem",
};
