#!/usr/bin/env tsx
/**
 * apply-manual-migrations
 *
 * Applies every *.sql file in platform/db/migrations/manual/ in
 * alphanumeric order against the database at DATABASE_URL.
 *
 * Run via: pnpm db:apply:manual
 * (Which forwards through dotenv-cli so .env.local is loaded.)
 *
 * Idempotent — the SQL files use CREATE … IF NOT EXISTS,
 * ON CONFLICT DO NOTHING, and IF EXISTS guards, so re-running is safe.
 * Logs each file as it succeeds; exits non-zero on the first failure.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const MIGRATIONS_DIR = join(
  REPO_ROOT,
  "platform",
  "db",
  "migrations",
  "manual",
);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Run via `pnpm db:apply:manual` so .env.local loads, or export DATABASE_URL manually.",
    );
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No .sql files found in platform/db/migrations/manual/.");
    return;
  }

  console.log(
    `Applying ${files.length} manual migration${files.length === 1 ? "" : "s"} → ${maskUrl(url)}\n`,
  );

  // Same client config as platform/db/client.ts: pgbouncer in transaction
  // mode doesn't support prepared statements.
  const sql = postgres(url, { prepare: false, max: 1 });

  try {
    for (const file of files) {
      const path = join(MIGRATIONS_DIR, file);
      const body = readFileSync(path, "utf-8");
      process.stdout.write(`  • ${file} … `);
      try {
        // sql.unsafe runs raw SQL without parameter binding — needed for
        // multi-statement files. The files contain only trusted hand-
        // written SQL (no user input), so unsafe is appropriate here.
        await sql.unsafe(body);
        console.log("ok");
      } catch (err) {
        console.log("FAILED");
        console.error(`\n${file} failed:\n${err}`);
        process.exit(1);
      }
    }
    console.log(`\nDone. ${files.length} file(s) applied.`);
  } finally {
    await sql.end();
  }
}

// Hide the password segment of a postgres URL when logging.
function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
