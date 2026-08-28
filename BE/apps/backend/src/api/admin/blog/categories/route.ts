import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBlogCategoryWorkflow } from "../../../../workflows/blog/create-category"

const CATEGORY_FIELDS = ["id", "name", "slug", "description", "created_at", "updated_at"]

type CreateBlogCategoryBody = {
  name: string
  slug?: string
  description?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: blog_categories, metadata } = await query.graph({
    entity: "blog_category",
    fields: CATEGORY_FIELDS,
    filters: {},
    pagination: { order: { name: "ASC" } },
  })

  res.json({ blog_categories, count: metadata?.count ?? blog_categories.length })
}

export async function POST(
  req: MedusaRequest<CreateBlogCategoryBody>,
  res: MedusaResponse
) {
  const { result } = await createBlogCategoryWorkflow(req.scope).run({
    input: req.body,
  })

  res.json({ blog_category: result })
}
