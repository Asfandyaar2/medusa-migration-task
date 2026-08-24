import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { GetVapeProductsQuery } from "./validators"

export const GET = async (
  req: MedusaRequest<unknown, GetVapeProductsQuery>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { collection_handle, nicotine_strength } = req.validatedQuery

  const filters: Record<string, unknown> = { status: "published" }

  if (collection_handle) {
    filters.collection = { handle: collection_handle }
  }

  if (nicotine_strength) {
    filters.variants = { options: { value: nicotine_strength } }
  }

  const { data: vape_products, metadata } = await query.graph({
    entity: "product",
    ...req.queryConfig,
    filters,
  })

  res.json({
    vape_products,
    count: metadata?.count ?? vape_products.length,
    limit: metadata?.take,
    offset: metadata?.skip,
  })
}
