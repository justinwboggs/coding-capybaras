// JSON-LD Article schema builder for blog posts. Pure function, no I/O and no
// "server-only" import — the post page renders the returned object into a
// <script type="application/ld+json"> block, mirroring the WebSite /
// Organization blocks in app/layout.tsx.
import type { PostFrontmatter } from "./schema";

// Convert a YYYY-MM-DD authored date to an ISO 8601 string for structured
// data. We treat the date as UTC midnight so the output is stable regardless
// of build-machine timezone.
function toIso(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export interface ArticleJsonLdInput {
  slug: string;
  frontmatter: PostFrontmatter;
  siteUrl: string;
  /** Publisher org name — branding.legalEntityName. */
  publisher: string;
  /** Optional org logo URL — branding.logoUrl (omitted when empty). */
  logoUrl?: string;
  /** Fallback author when frontmatter omits one — branding.appName. */
  fallbackAuthor: string;
}

export function buildArticleJsonLd({
  slug,
  frontmatter,
  siteUrl,
  publisher,
  logoUrl,
  fallbackAuthor,
}: ArticleJsonLdInput): Record<string, unknown> {
  const canonicalUrl = `${siteUrl}/blog/${slug}`;
  const published = toIso(frontmatter.date);
  const modified = toIso(frontmatter.updated ?? frontmatter.date);

  const publisherLd: Record<string, unknown> = {
    "@type": "Organization",
    name: publisher,
  };
  if (logoUrl) {
    publisherLd.logo = { "@type": "ImageObject", url: logoUrl };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: published,
    dateModified: modified,
    author: {
      "@type": "Person",
      name: frontmatter.author ?? fallbackAuthor,
    },
    publisher: publisherLd,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };
}
