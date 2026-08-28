import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateBlogTagWorkflow } from "../../../../../workflows/blog/update-tag"
import { deleteBlogTagWorkflow } from "../../../../../workflows/blog/delete-tag"

const TAG_FIELDS = ["id", "name", "slug", "created_at", "updated_at"]

type UpdateBlogTagBody = {
  name?: string
  slug?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: blog_tags } = await query.graph({
    entity: "blog_tag",
    fields: TAG_FIELDS,
    filters: { id: req.params.id },
  })

  if (!blog_tags.length) {
    res.status(404).json({ message: "Tag not found" })
    return
  }

  res.json({ blog_tag: blog_tags[0] })
}

export async function POST(
  req: MedusaRequest<UpdateBlogTagBody>,
  res: MedusaResponse
) {
  const { result } = await updateBlogTagWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.body,
    },
  })

  res.json({ blog_tag: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteBlogTagWorkflow(req.scope).run({
    input: req.params.id,
  })

  res.json({ id: req.params.id, object: "blog_tag", deleted: true })
}
