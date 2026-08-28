import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateBlogPostWorkflow } from "../../../../../workflows/blog/update-post"
import { deleteBlogPostWorkflow } from "../../../../../workflows/blog/delete-post"
import { BLOG_MODULE } from "../../../../../modules/blog"
import BlogModuleService from "../../../../../modules/blog/service"
import { attachTags } from "../../../../../modules/blog/utils/resolve-tags"

const POST_FIELDS = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "status",
  "published_at",
  "featured_image",
  "seo_title",
  "seo_description",
  "author_name",
  "author_id",
  "tag_ids",
  "created_at",
  "updated_at",
  "category.*",
]

type UpdateBlogPostBody = {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  status?: "draft" | "published"
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_name?: string
  category_id?: string | null
  tag_ids?: string[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "blog_post",
    fields: POST_FIELDS,
    filters: { id: req.params.id },
  })

  if (!data.length) {
    res.status(404).json({ message: "Post not found" })
    return
  }

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const [blog_post] = await attachTags(blogModuleService, data)

  res.json({ blog_post })
}

export async function POST(
  req: MedusaRequest<UpdateBlogPostBody>,
  res: MedusaResponse
) {
  const { result } = await updateBlogPostWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.body,
    },
  })

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const [blog_post] = await attachTags(blogModuleService, [result])

  res.json({ blog_post })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteBlogPostWorkflow(req.scope).run({
    input: req.params.id,
  })

  res.json({ id: req.params.id, object: "blog_post", deleted: true })
}
