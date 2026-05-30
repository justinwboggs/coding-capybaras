# Blog content

Your blog posts live here as `.mdx` files — one file per post. The filename
(minus `.mdx`) becomes the URL slug, so `my-first-post.mdx` is served at
`/blog/my-first-post`.

The included `getting-started.mdx` is a template. Edit it, delete it, or
replace it freely — it documents the frontmatter fields and body conventions.

Each post needs a frontmatter block at the top:

```mdx
---
title: "Your post title"
description: "One sentence used for SEO and the post list."
date: "2026-05-30"          # YYYY-MM-DD, required
author: "Your Name"          # optional
tags: ["news"]               # optional
updated: "2026-06-01"        # optional, YYYY-MM-DD
published: true              # optional, defaults to true; false hides the post
---
```

A malformed frontmatter block fails the build with an error naming the file,
field, and reason — so a broken post can never ship silently.
