import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { MDXRemote } from "next-mdx-remote/rsc";

import { getBranding } from "@/platform/lib/config";

import { buildArticleJsonLd } from "@/website/lib/blog/jsonld";
import { getAllSlugs, getPostBySlug } from "@/website/lib/blog/posts";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// The content set is fixed at build time (one .mdx file per post), so any slug
// not produced by generateStaticParams is a genuine 404. dynamicParams=false
// makes Next return 404 for those without rendering — the in-body notFound()
// below stays as defense-in-depth (e.g. a post flipped to published:false).
export const dynamicParams = false;

// Statically generate one page per published post at build time.
export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Not found" };
  }

  const { appName } = await getBranding();
  const { title, description, author, date, updated } = post.frontmatter;
  const canonical = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: appName,
      publishedTime: date,
      modifiedTime: updated ?? date,
      ...(author ? { authors: [author] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

// Human-readable date ("May 30, 2026"). ISO stays in the <time datetime>
// attribute and in JSON-LD. UTC so output is build-machine-timezone stable.
function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const { title, description, author, date, updated } = post.frontmatter;
  const { appName, legalEntityName, logoUrl } = await getBranding();

  const jsonLd = buildArticleJsonLd({
    slug,
    frontmatter: post.frontmatter,
    siteUrl: SITE_URL,
    publisher: legalEntityName,
    logoUrl: logoUrl || undefined,
    fallbackAuthor: appName,
  });

  // Prose styling mirrors the terms/privacy arbitrary-variant pattern so the
  // body inherits the terracotta/earthy palette via CSS variables — no
  // @tailwindcss/typography. h1 comes from frontmatter (single per page); the
  // MDX body uses h2/h3.
  return (
    <article className="container max-w-3xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:text-foreground/90 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-foreground/90">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="space-y-3 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
        <p className="text-sm text-muted-foreground">
          <time dateTime={date}>{formatDate(date)}</time>
          {author ? <> · {author}</> : null}
          {updated && updated !== date ? (
            <> · Updated <time dateTime={updated}>{formatDate(updated)}</time></>
          ) : null}
        </p>
      </header>

      <MDXRemote source={post.body} />
    </article>
  );
}
