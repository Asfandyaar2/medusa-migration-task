import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const CATEGORY_FIELDS = ["id", "name", "slug", "description"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: blog_categories } = await query.graph({
    entity: "blog_category",
    fields: CATEGORY_FIELDS,
    filters: {},
    pagination: { order: { name: "ASC" } },
  })

  res.json({ blog_categories })
}
