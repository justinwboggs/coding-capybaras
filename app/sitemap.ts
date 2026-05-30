import type { MetadataRoute } from "next";

import { getPublishedPosts } from "@/website/lib/blog/posts";

// Marketing routes only — auth-gated and API surfaces are excluded both here
// (no entry) and in robots.ts (Disallow). /sign-in is a public route but is
// intentionally NOT indexable: it's an auth entry point with no content.
//
// Tenants can extend this list when they add their own marketing routes
// (e.g. /docs) — the canonical URL is config-driven so no other changes are
// needed. The blog index and every published /blog/[slug] are appended below.
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // One entry per published post; lastModified prefers `updated` over `date`.
  const blogPosts: MetadataRoute.Sitemap = getPublishedPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(
      `${post.frontmatter.updated ?? post.frontmatter.date}T00:00:00.000Z`,
    ),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/business/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...blogPosts,
  ];
}
