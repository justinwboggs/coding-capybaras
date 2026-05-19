import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Note: this client imports the product schema from /product/ to give Sarah
// a unified db API. This is the ONLY platform → product dependency in the
// codebase. It's intentional — Sarah uses a single `db` import for both
// her product tables (app_*) and platform tables (platform_*).
import * as appSchema from "@/product/db/schema/app";

import * as platformSchema from "./schema/platform";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Single pooled client per server instance. Supabase pooled URL is required.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // pgbouncer in transaction mode does not support prepared statements
});

// Both schemas merged. `appSchema` is empty until Sarah adds her first
// `app_*` table — the spread is a no-op for now.
const schema = { ...platformSchema, ...appSchema };

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
