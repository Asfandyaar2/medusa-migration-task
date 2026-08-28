import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"
import { attachTags } from "../../../../modules/blog/utils/resolve-tags"

const POST_FIELDS = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "published_at",
  "featured_image",
  "seo_title",
  "seo_description",
  "author_name",
  "tag_ids",
  "category.id",
  "category.name",
  "category.slug",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { category, limit, offset } = req.query as Record<string, string>

  const filters: Record<string, unknown> = { status: "published" }
  if (category) {
    filters["category.slug"] = category
  }

  const { data, metadata } = await query.graph({
    entity: "blog_post",
    fields: POST_FIELDS,
    filters,
    pagination: {
      skip: offset ? Number(offset) : 0,
      take: limit ? Number(limit) : 12,
      order: { published_at: "DESC" },
    },
  })

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const blog_posts = await attachTags(blogModuleService, data)

  res.json({ blog_posts, count: metadata?.count ?? blog_posts.length })
}
