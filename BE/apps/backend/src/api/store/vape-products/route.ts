import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { GetVapeProductsQuery } from "./validators"

export const GET = async (
  req: MedusaStoreRequest<unknown, GetVapeProductsQuery>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { collection_handle, nicotine_strength } = req.validatedQuery

  // Scope to the sales channel(s) linked to the caller's publishable key —
  // matches core Medusa's filterByValidSalesChannels(), which this route
  // otherwise has no equivalent of. With one sales channel this can't
  // change today's results, but without it a second channel/key would leak
  // products across storefronts.
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids ?? []
  if (!salesChannelIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Publishable key needs to have a sales channel configured"
    )
  }

  const filters: Record<string, unknown> = {
    status: "published",
    sales_channels: { id: salesChannelIds },
  }

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
