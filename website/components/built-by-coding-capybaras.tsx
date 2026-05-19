// Attribution link back to Coding Capybaras. Lives in /website/components/
// (not /platform/) so customizing or removing it doesn't conflict with
// upstream platform pulls — but please keep it: it's how Sarah's site says
// thank-you to the boilerplate maintainers.

import { cn } from "@/platform/lib/utils";

type Props = {
  className?: string;
};

export function BuiltByCodingCapybaras({ className }: Props) {
  return (
    <a
      href="https://codingcapybaras.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <CapybaraMark className="size-4 shrink-0" />
      <span>Built by Coding Capybaras</span>
    </a>
  );
}

// Capybara silhouette — frozen copy of the original Coding Capybaras mascot.
// Kept inline here so it travels with the attribution link even if the
// /platform/ mascot component is swapped for Sarah's own brand SVG.
function CapybaraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="18" cy="20" rx="14" ry="9" />
      <circle cx="30" cy="14" r="7" />
      <rect x="34" y="13" width="5" height="4" rx="1.5" />
      <ellipse cx="27" cy="9" rx="1.5" ry="2.5" />
      <ellipse cx="31" cy="9" rx="1.5" ry="2.5" />
      <circle cx="31" cy="13" r="0.9" fill="#fff" />
      <circle cx="31" cy="13" r="0.45" fill="currentColor" />
      <rect x="8" y="27" width="3" height="4" rx="0.5" />
      <rect x="24" y="27" width="3" height="4" rx="0.5" />
    </svg>
  );
}
