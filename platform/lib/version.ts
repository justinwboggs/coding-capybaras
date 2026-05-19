// ─────────────────────────────────────────────────────────────────
// Platform versioning + changelog.
//
// CURRENT_VERSION bumps trigger the in-app "Update available" indicator for
// Pro users (gated by canAccess 'updates.notifications'). The acknowledge
// flow writes platform_users.metadata.last_seen_version, suppressing the
// indicator until the next bump.
//
// Bump CURRENT_VERSION and prepend a CHANGELOG entry on every release that
// affects the user-facing starter template — that's the contract this signals.
// Lives in lib/ (flat per CLAUDE.md), NOT lib/platform/ (that path is the
// starter template's layout).
// ─────────────────────────────────────────────────────────────────

export const CURRENT_VERSION = "1.0.0";

export interface ChangelogEntry {
  version: string;
  /** ISO date string, e.g. "2026-05-15". */
  date: string;
  changes: string[];
}

// Newest first. Each version appears exactly once. Versions follow semver
// (major.minor.patch) so getUnseenChanges() can ignore unknown strings safely.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-05-15",
    changes: [
      "Initial public release",
      "Pro tier with lifetime access ($97 launch / $147 standard)",
      "Configuration GUI: branding, pricing, email templates, feature flags",
      "Integration marketplace surface (registry, gated by Pro)",
      "Priority support flow for Pro users",
      "In-app boilerplate-update notifications",
    ],
  },
];

/**
 * The changelog entries the user hasn't acknowledged yet. CHANGELOG is sorted
 * newest-first, so we slice everything *before* lastSeen. Unknown / missing
 * lastSeen returns the full changelog.
 */
export function getUnseenChanges(
  lastSeen: string | undefined | null,
): ChangelogEntry[] {
  if (!lastSeen) return CHANGELOG;
  const idx = CHANGELOG.findIndex((e) => e.version === lastSeen);
  if (idx === -1) return CHANGELOG;
  return CHANGELOG.slice(0, idx);
}

/**
 * Generates a Claude Code prompt the Pro user can paste into their own
 * project to pull the latest starter-template changes safely. Placeholder
 * upstream repo URL — replace with the real public template repo when it
 * exists. The prompt explicitly defers to the platform/product boundary
 * documented in SPEC.md §6.
 */
export function updatePromptForUser(
  lastSeen: string | undefined | null,
): string {
  const from = lastSeen ?? "(unknown — first time)";
  return [
    `This project was built from the Platform starter template (currently on version ${from}).`,
    `A newer version is available: ${CURRENT_VERSION}.`,
    ``,
    `Please pull the platform-layer changes only — never the product layer.`,
    ``,
    `1. Add the upstream template (one-time):`,
    `   git remote add upstream https://github.com/REPLACE_ME/starter-template.git`,
    ``,
    `2. Fetch + inspect:`,
    `   git fetch upstream`,
    `   git log --oneline v${from}..upstream/main`,
    ``,
    `3. Merge platform paths only:`,
    `   git checkout upstream/main -- 'app/(platform)/' 'lib/platform/' 'components/platform/' 'db/schema/platform.ts'`,
    ``,
    `4. Resolve conflicts manually. Do NOT touch app/(product)/, lib/product/, components/product/, or db/schema/app.ts — those are your product code.`,
    ``,
    `5. Verify before committing:`,
    `   pnpm install && pnpm typecheck && pnpm lint && pnpm build`,
    ``,
    `6. Commit with a descriptive message referencing the platform version (${CURRENT_VERSION}).`,
  ].join("\n");
}
