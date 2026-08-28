import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBlogTagWorkflow } from "../../../../workflows/blog/create-tag"

const TAG_FIELDS = ["id", "name", "slug", "created_at", "updated_at"]

type CreateBlogTagBody = {
  name: string
  slug?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: blog_tags, metadata } = await query.graph({
    entity: "blog_tag",
    fields: TAG_FIELDS,
    filters: {},
    pagination: { order: { name: "ASC" } },
  })

  res.json({ blog_tags, count: metadata?.count ?? blog_tags.length })
}

export async function POST(
  req: MedusaRequest<CreateBlogTagBody>,
  res: MedusaResponse
) {
  const { result } = await createBlogTagWorkflow(req.scope).run({
    input: req.body,
  })

  res.json({ blog_tag: result })
}
