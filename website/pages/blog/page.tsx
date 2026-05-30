import { type Metadata, type Route } from "next";
import Link from "next/link";

import { getBranding } from "@/platform/lib/config";

import { getPublishedPosts } from "@/website/lib/blog/posts";

// Index metadata. Title "Blog" composes with the appName template from the
// root layout; description is a sensible hardcoded default (no config field —
// intentionally out of scope).
export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getBranding();
  return {
    title: "Blog",
    description: `Articles and updates from ${appName}.`,
  };
}

// Human-readable date ("May 30, 2026"). ISO stays in the <time datetime>
// attribute. UTC so output is build-machine-timezone stable.
function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default function BlogIndexPage() {
  const posts = getPublishedPosts();

  return (
    <section className="container max-w-3xl py-16 sm:py-20">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">
          Articles and updates.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-12 text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="divide-y">
          {posts.map((post) => (
            <li key={post.slug} className="py-8">
              <article className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  <Link
                    href={`/blog/${post.slug}` as Route}
                    className="transition-colors hover:text-primary"
                  >
                    {post.frontmatter.title}
                  </Link>
                </h2>
                <time
                  dateTime={post.frontmatter.date}
                  className="text-sm text-muted-foreground"
                >
                  {formatDate(post.frontmatter.date)}
                </time>
                <p className="leading-relaxed text-foreground/90">
                  {post.frontmatter.description}
                </p>
                <Link
                  href={`/blog/${post.slug}` as Route}
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Read more →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
