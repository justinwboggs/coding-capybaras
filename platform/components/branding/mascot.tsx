// REPLACE ME — placeholder mascot. Drop your own brand SVG content into this component.
/**
 * Brand mascot.
 *
 * Lives in /platform/components/branding/ so both the website chrome
 * (/website/pages/_website-layout.tsx) and the authed chrome
 * (/platform/pages/_authed-layout.tsx) share a single source of truth.
 */

import { cn } from "@/platform/lib/utils";

type MascotProps = {
  className?: string;
};

export function Mascot({ className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 40 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect x="6" y="4" width="28" height="24" rx="6" />
    </svg>
  );
}
