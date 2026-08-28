import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateBlogCategoryWorkflow } from "../../../../../workflows/blog/update-category"
import { deleteBlogCategoryWorkflow } from "../../../../../workflows/blog/delete-category"

const CATEGORY_FIELDS = ["id", "name", "slug", "description", "created_at", "updated_at"]

type UpdateBlogCategoryBody = {
  name?: string
  slug?: string
  description?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: blog_categories } = await query.graph({
    entity: "blog_category",
    fields: CATEGORY_FIELDS,
    filters: { id: req.params.id },
  })

  if (!blog_categories.length) {
    res.status(404).json({ message: "Category not found" })
    return
  }

  res.json({ blog_category: blog_categories[0] })
}

export async function POST(
  req: MedusaRequest<UpdateBlogCategoryBody>,
  res: MedusaResponse
) {
  const { result } = await updateBlogCategoryWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.body,
    },
  })

  res.json({ blog_category: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteBlogCategoryWorkflow(req.scope).run({
    input: req.params.id,
  })

  res.json({ id: req.params.id, object: "blog_category", deleted: true })
}
