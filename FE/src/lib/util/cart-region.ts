// Single source of truth for the region string the flat (non-[countryCode])
// pages pass into cart/product data calls — same env var those pages already
// use for pricing (see getProductByHandle in src/app/products/[handle]/page.tsx).
export const CART_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
