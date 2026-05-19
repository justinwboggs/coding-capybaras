import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't auto-load .env.local. Load it explicitly so `pnpm db:*`
// commands pick up DATABASE_URL without shell wrappers (which mangle special
// characters in passwords like <, >, &).
loadEnv({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for drizzle-kit. Set it in .env.local.",
  );
}

export default defineConfig({
  schema: ["./platform/db/schema/platform.ts", "./product/db/schema/app.ts"],
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Don't generate migrations against Supabase-managed schemas.
  schemaFilter: ["public"],
});
