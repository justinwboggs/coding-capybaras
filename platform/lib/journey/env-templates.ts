// ─────────────────────────────────────────────────────────────────
// Static .env.local templates for the journey UX.
//
// SECURITY NOTE: every value here is a placeholder. By design, the platform
// NEVER asks the user to paste real secrets into web forms. The journey
// stages display these templates, the user copies them to their own machine,
// and they replace the placeholders locally — secrets never leave their
// device. See lib/journey/_components/security-bits.tsx for the user-facing
// callouts.
//
// Safe to import from client components: pure strings, no I/O.
// ─────────────────────────────────────────────────────────────────

// Placeholder values use friendly, self-explanatory "your_xxx_here" strings
// rather than realistic-looking patterns — the goal is for a non-technical
// reader to immediately understand "I need to swap this out", not to wonder
// whether the placeholder is already a real value.
// COPY_TODO: review tone — DATABASE_URL pooler format example, region/project-ref are illustrative.
export const ENV_TEMPLATE_SUPABASE = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.your-project-id:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

export const ENV_TEMPLATE_STRIPE = `# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here`;

export const ENV_TEMPLATE_RESEND = `# Resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Your App Name <onboarding@resend.dev>`;

/**
 * The complete .env.local template — a comprehensive starting file with EVERY
 * env var the platform expects, section headers, and inline comments
 * explaining each value. The per-stage forms show shorter snippets above
 * (just the keys the user touches at that step); this download is for users
 * who want a complete starting file in one shot.
 *
 * Stays completely static: never reads journey.data or any other user state.
 * Identical bytes for every user.
 */
export function generateEnvFileTemplate(): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `# .env.local — generated ${today}`,
    `# This is the file your app reads when it runs on your computer. Save it`,
    `# at the top of your project folder (the same folder that has package.json).`,
    `#`,
    `# Replace each "your_xxx_here" placeholder with the real value from the`,
    `# matching provider's dashboard. The journey walks you through where to`,
    `# find each one.`,
    `#`,
    `# This file is STATIC — every user downloads the same bytes, no real`,
    `# secrets are baked in. The platform never collects your keys; they live`,
    `# only on your machine. Make sure .env.local is in your .gitignore (the`,
    `# boilerplate sets this up for you).`,
    ``,
    `# ─── App ──────────────────────────────────────────────────────────`,
    `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
    `NODE_ENV=development`,
    ``,
    `# ─── Supabase (database + auth) ───────────────────────────────────`,
    `# From Supabase Dashboard → Project Settings → API`,
    `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`,
    `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`,
    `# Project Settings → Database → use the Transaction pooler connection string`,
    // COPY_TODO: review tone — DATABASE_URL pooler format example, region/project-ref are illustrative.
    `DATABASE_URL=postgresql://postgres.your-project-id:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    ``,
    `# ─── Stripe (payments) ────────────────────────────────────────────`,
    `PAYMENT_PROVIDER=stripe`,
    `# From Stripe Dashboard → Developers → API keys (in test mode)`,
    `STRIPE_SECRET_KEY=sk_test_your_secret_key_here`,
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here`,
    `# Stripe webhook secret — see Stage 3 instructions for how to get it`,
    `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here`,
    `BCPARTNERS_WEBHOOK_SECRET=`,
    ``,
    `# ─── Resend (email) ───────────────────────────────────────────────`,
    `# From resend.com → API Keys`,
    `RESEND_API_KEY=re_your_api_key_here`,
    `# Until you verify your own sending domain, leave this as onboarding@resend.dev`,
    `EMAIL_FROM=Your App Name <onboarding@resend.dev>`,
    `SUPPORT_EMAIL=`,
    ``,
    `# ─── Other (fill in when you wire each one up) ────────────────────`,
    `NEXT_PUBLIC_SENTRY_DSN=`,
    `SENTRY_ORG=`,
    `SENTRY_PROJECT=`,
    `SENTRY_AUTH_TOKEN=`,
    `NEXT_PUBLIC_POSTHOG_KEY=`,
    `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`,
    `GITHUB_OAUTH_CLIENT_ID=`,
    `GITHUB_OAUTH_CLIENT_SECRET=`,
    `VERCEL_OAUTH_CLIENT_ID=`,
    `VERCEL_OAUTH_CLIENT_SECRET=`,
    ``,
  ].join("\n");
}
