import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "../../../../../modules/blog"
import BlogModuleService from "../../../../../modules/blog/service"
import { attachTags } from "../../../../../modules/blog/utils/resolve-tags"

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
  const { data } = await query.graph({
    entity: "blog_post",
    fields: POST_FIELDS,
    filters: {
      slug: req.params.slug,
      status: "published",
    },
  })

  if (!data.length) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const [blog_post] = await attachTags(blogModuleService, data)

  res.json({ blog_post })
}
