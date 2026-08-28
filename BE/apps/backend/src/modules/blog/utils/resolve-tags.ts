import BlogModuleService from "../service"

type PostWithTagIds = {
  // model.json() gives query.graph() results a loose Record<string, unknown>
  // type even though tag_ids is always written as a string[] at runtime —
  // typed unknown here and narrowed by tagIdsOf() below rather than trusting
  // the ORM's column type.
  tag_ids?: unknown
  [key: string]: unknown
}

const tagIdsOf = (post: PostWithTagIds): string[] =>
  Array.isArray(post.tag_ids) ? (post.tag_ids as string[]) : []

// tag_ids is a plain JSON array on blog_post (see blog-post.ts for why this
// isn't a formal many-to-many relation) — resolve the referenced BlogTag
// rows here so API responses still expose a `tags: [{id, name, slug}]`
// array, same shape callers would expect from a real relation.
export async function attachTags<T extends PostWithTagIds>(
  blogModuleService: BlogModuleService,
  posts: T[]
): Promise<(T & { tags: { id: string; name: string; slug: string }[] })[]> {
  const allTagIds = Array.from(new Set(posts.flatMap(tagIdsOf)))

  const tags = allTagIds.length
    ? await blogModuleService.listBlogTags({ id: allTagIds })
    : []
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))

  return posts.map((post) => ({
    ...post,
    tags: tagIdsOf(post)
      .map((id) => tagsById.get(id))
      .filter((tag): tag is NonNullable<typeof tag> => !!tag)
      .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
  }))
}
