import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBlogPostWorkflow } from "../../../../workflows/blog/create-post"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"
import { attachTags } from "../../../../modules/blog/utils/resolve-tags"

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

type CreateBlogPostBody = {
  title: string
  slug?: string
  excerpt?: string
  content: string
  status?: "draft" | "published"
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_name?: string
  category_id?: string
  tag_ids?: string[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { status, category_id, q, limit, offset } = req.query as Record<string, string>

  const filters: Record<string, unknown> = {}
  if (status) {
    filters.status = status
  }
  if (category_id) {
    filters.category_id = category_id
  }
  if (q) {
    filters.title = { $ilike: `%${q}%` }
  }

  const { data, metadata } = await query.graph({
    entity: "blog_post",
    fields: POST_FIELDS,
    filters,
    pagination: {
      skip: offset ? Number(offset) : 0,
      take: limit ? Number(limit) : 20,
      order: { created_at: "DESC" },
    },
  })

  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const blog_posts = await attachTags(blogModuleService, data)

  res.json({ blog_posts, count: metadata?.count ?? blog_posts.length })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateBlogPostBody>,
  res: MedusaResponse
) {
  const authorId = req.auth_context?.actor_id

  const { result } = await createBlogPostWorkflow(req.scope).run({
    input: {
      ...req.body,
      author_id: authorId,
    },
  })

  res.json({ blog_post: result })
}
