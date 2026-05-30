// Frontmatter schema for file-based blog posts. Pure zod — no fs, no
// "server-only" import — so it can be pulled in from either side of the
// Server Components boundary (the loader in posts.ts and the JSON-LD builder
// both reference the inferred type).
//
// Note: there is intentionally NO `slug` field. The slug is derived from the
// filename (`my-post.mdx` → `my-post`) in posts.ts. Filename uniqueness is
// enforced by the filesystem, which removes a whole class of slug-collision
// bugs.
import { z } from "zod";

// Dates are authored and validated as YYYY-MM-DD strings (not coerced to
// Date) so they stay serializable and timezone-stable. They're converted to
// ISO 8601 only at render time for <time> attributes and JSON-LD.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must match YYYY-MM-DD');

export const postFrontmatterSchema = z.object({
  title: z.string().min(1, "is required"),
  description: z.string().min(1, "is required"),
  date: isoDate,
  // Optional fields.
  author: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  updated: isoDate.optional(),
  // The one in-scope draft mechanism. Unpublished posts are excluded from the
  // index, the sitemap, and generateStaticParams (so they 404 in production).
  published: z.boolean().default(true),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
