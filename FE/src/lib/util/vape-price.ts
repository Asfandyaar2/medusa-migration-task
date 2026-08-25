import { VapeProductVariant } from "@lib/data/vape-products"

// A plain (non-server-action) helper — kept out of vape-products.ts because
// a "use server" file requires every exported function to be async, and
// this one doesn't need to be.
export function firstPrice(variant: VapeProductVariant) {
  const price = variant.prices?.[0]
  if (!price) return null
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency_code.toUpperCase(),
  }).format(price.amount)
}
