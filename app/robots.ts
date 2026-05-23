import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Allow indexing of marketing routes (everything in sitemap.ts); block the
// authed surface, the API surface, and the auth-entry routes that have no
// content value. Matches the route groups under app/(authed)/ and app/api/.
// Trailing-slash variants are listed defensively — some crawlers treat the
// presence/absence of a trailing slash strictly.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/sign-in",
        "/dashboard",
        "/account/",
        "/config",
        "/config/",
        "/journey",
        "/journey/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
