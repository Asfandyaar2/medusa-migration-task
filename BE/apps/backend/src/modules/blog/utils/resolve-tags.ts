import BlogModuleService from "../service"

type PostWithTagIds = {
  tag_ids?: string[] | null
  [key: string]: unknown
}

// tag_ids is a plain JSON array on blog_post (see blog-post.ts for why this
// isn't a formal many-to-many relation) — resolve the referenced BlogTag
// rows here so API responses still expose a `tags: [{id, name, slug}]`
// array, same shape callers would expect from a real relation.
export async function attachTags<T extends PostWithTagIds>(
  blogModuleService: BlogModuleService,
  posts: T[]
): Promise<(T & { tags: { id: string; name: string; slug: string }[] })[]> {
  const allTagIds = Array.from(
    new Set(posts.flatMap((post) => post.tag_ids ?? []))
  )

  const tags = allTagIds.length
    ? await blogModuleService.listBlogTags({ id: allTagIds })
    : []
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))

  return posts.map((post) => ({
    ...post,
    tags: (post.tag_ids ?? [])
      .map((id) => tagsById.get(id))
      .filter((tag): tag is NonNullable<typeof tag> => !!tag)
      .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
  }))
}
