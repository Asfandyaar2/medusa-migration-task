"use server"

import { sdk } from "@lib/config"

export type BlogTag = {
  id: string
  name: string
  slug: string
}

export type BlogCategory = {
  id: string
  name: string
  slug: string
  description?: string | null
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  published_at: string
  featured_image?: string | null
  seo_title?: string | null
  seo_description?: string | null
  author_name?: string | null
  category?: BlogCategory | null
  tags: BlogTag[]
}

// Deliberately uncached (unlike products/collections, which use
// force-cache + tags): nothing in this project actively calls
// revalidateTag when a post is created/edited/published from the admin, so
// a cached blog fetch would keep serving a stale list/post until the dev
// server restarts — exactly the staleness class this project has hit
// before for products/collections after a reseed. A blog's write frequency
// is low enough that skipping the cache costs nothing noticeable, and it
// means a newly published post shows up on the next request, not the next
// restart.
export const listBlogPosts = async ({
  categoryHandle,
  limit = 12,
  offset = 0,
}: {
  categoryHandle?: string
  limit?: number
  offset?: number
} = {}): Promise<{ blog_posts: BlogPost[]; count: number }> => {
  return sdk.client.fetch<{ blog_posts: BlogPost[]; count: number }>(
    "/store/blog/posts",
    {
      query: {
        ...(categoryHandle && { category: categoryHandle }),
        limit,
        offset,
      },
      cache: "no-store",
    }
  )
}

export const getBlogPostBySlug = async (
  slug: string
): Promise<BlogPost | null> => {
  return sdk.client
    .fetch<{ blog_post: BlogPost }>(`/store/blog/posts/${slug}`, {
      cache: "no-store",
    })
    .then(({ blog_post }) => blog_post)
    .catch(() => null)
}

export const listBlogCategories = async (): Promise<BlogCategory[]> => {
  return sdk.client
    .fetch<{ blog_categories: BlogCategory[] }>("/store/blog/categories", {
      cache: "no-store",
    })
    .then(({ blog_categories }) => blog_categories)
}
