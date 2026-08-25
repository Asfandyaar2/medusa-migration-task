"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

// Calls this project's custom Day 1 backend route (BE/apps/backend/src/api/
// store/vape-products) directly, rather than the standard /store/products
// endpoint — this is what actually exercises the custom extension from the
// storefront. Its default fields include raw variants.prices (amount +
// currency_code), not the region-aware variants.calculated_price that
// getProductPrice() expects, since the route has no region_id/pricing-
// context parameter — fine here since this catalogue has one fixed USD
// price per variant, no region-specific pricing to calculate.
export type VapeProductVariant = {
  id: string
  title: string
  sku: string | null
  prices?: { amount: number; currency_code: string }[]
}

export type VapeProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  description: string | null
  collection?: { id: string; handle: string }
  variants?: VapeProductVariant[]
}

export const listVapeProducts = async ({
  collectionHandle,
  nicotineStrength,
}: {
  collectionHandle?: string
  nicotineStrength?: string
}): Promise<{ vape_products: VapeProduct[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("vape-products")),
  }

  return sdk.client.fetch<{ vape_products: VapeProduct[]; count: number }>(
    "/store/vape-products",
    {
      query: {
        ...(collectionHandle ? { collection_handle: collectionHandle } : {}),
        ...(nicotineStrength ? { nicotine_strength: nicotineStrength } : {}),
        limit: 100,
      },
      next,
      cache: "force-cache",
    }
  )
}

