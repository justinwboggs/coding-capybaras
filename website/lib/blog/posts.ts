// File-based blog loader. Reads website/content/blog/*.mdx, splits frontmatter
// from body with gray-matter, validates frontmatter with zod, and returns
// posts sorted newest-first. Runs at build time under generateStaticParams /
// generateMetadata and in the sitemap — never in the browser.
import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

import { postFrontmatterSchema, type PostFrontmatter } from "./schema";

// Resolve against cwd (repo root during `next build`, including on Vercel).
const BLOG_DIR = join(process.cwd(), "website", "content", "blog");

export interface Post {
  /** Derived from the filename (minus the .mdx extension). The URL slug. */
  slug: string;
  frontmatter: PostFrontmatter;
  /** Raw MDX body (frontmatter stripped) for the post page to compile. */
  body: string;
}

// Validate frontmatter, wrapping any zod failure in a build-log-friendly error
// that names the file, the field, and the reason — so a tenant can fix a bad
// post in seconds rather than decoding a raw zod dump.
function validateFrontmatter(raw: unknown, filename: string): PostFrontmatter {
  const result = postFrontmatterSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "(root)";
        return `  - ${field}: ${issue.message}`;
      })
      .join("\n");
    throw new Error(
      `Frontmatter validation failed in website/content/blog/${filename}:\n${details}`,
    );
  }
  return result.data;
}

function readPostFile(filename: string): Post {
  const slug = filename.replace(/\.mdx$/, "");
  const raw = readFileSync(join(BLOG_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = validateFrontmatter(data, filename);
  return { slug, frontmatter, body: content };
}

function listMdxFiles(): string[] {
  let entries: string[];
  try {
    entries = readdirSync(BLOG_DIR);
  } catch {
    // Directory missing (e.g. a tenant deleted everything) — treat as empty.
    return [];
  }
  return entries.filter((name) => name.endsWith(".mdx"));
}

// Newest-first by authored date (descending). `updated` does not affect sort
// order — only the displayed/sitemap lastModified value.
function byDateDesc(a: Post, b: Post): number {
  return b.frontmatter.date.localeCompare(a.frontmatter.date);
}

/** All posts including unpublished. Sorted newest-first. */
export function getAllPosts(): Post[] {
  return listMdxFiles().map(readPostFile).sort(byDateDesc);
}

/** Published posts only (published !== false). Sorted newest-first. */
export function getPublishedPosts(): Post[] {
  return getAllPosts().filter((post) => post.frontmatter.published);
}

/** A single published post by slug, or null if missing/unpublished. */
export function getPostBySlug(slug: string): Post | null {
  return getPublishedPosts().find((post) => post.slug === slug) ?? null;
}

/** Slugs of published posts — for generateStaticParams. */
export function getAllSlugs(): string[] {
  return getPublishedPosts().map((post) => post.slug);
}
