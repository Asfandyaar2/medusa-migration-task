import { HttpTypes } from "@medusajs/types"
import { VapeProduct } from "@lib/data/vape-products"
import { firstPrice } from "./vape-price"
import { getProductPrice } from "./get-product-price"

export type ProductCardData = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  priceLabel: string | null
}

// Normalizes the two distinct product shapes this storefront fetches —
// the standard Store API's HttpTypes.StoreProduct and this task's custom
// /store/vape-products route's VapeProduct — into the one shape ProductCard
// renders. Two separate functions (rather than one accepting a union) since
// each shape prices itself differently: VapeProduct carries raw
// variants.prices with no region context, StoreProduct carries region-aware
// variants.calculated_price.
export function toCardProductFromVape(product: VapeProduct): ProductCardData {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    thumbnail: product.thumbnail,
    priceLabel: product.variants?.[0] ? firstPrice(product.variants[0]) : null,
  }
}

export function toCardProductFromStore(
  product: HttpTypes.StoreProduct
): ProductCardData {
  return {
    id: product.id,
    handle: product.handle!,
    title: product.title!,
    thumbnail: product.thumbnail ?? null,
    priceLabel:
      getProductPrice({ product }).cheapestPrice?.calculated_price ?? null,
  }
}
