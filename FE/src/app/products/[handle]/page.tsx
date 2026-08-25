import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import SiteHeader from "@modules/vape-store/components/site-header"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const STORE_NAME = "MIA Tyson Vape Deals"

type Props = {
  params: Promise<{ handle: string }>
}

async function getProductByHandle(handle: string) {
  const region = await getRegion(DEFAULT_REGION)
  if (!region) {
    return { product: null, region: null }
  }

  // There is no GET /store/products/:handle in Medusa v2 — retrieve by
  // filtering the list endpoint on `handle` and taking the first match.
  const product = await listProducts({
    countryCode: DEFAULT_REGION,
    queryParams: { handle },
  }).then(({ response }) => response.products[0] ?? null)

  return { product, region }
}

/**
 * Builds a schema.org Offer (single price) or AggregateOffer (variants
 * priced differently) depending on whether this product's variants actually
 * diverge in price — most of this catalogue doesn't, but the logic should
 * hold for a product that does.
 */
function buildOffers(product: HttpTypes.StoreProduct, canonicalUrl: string) {
  // Derive amount and currency from the same variant, not from variants[0]
  // for currency and "any variant with a price" for amounts — a variant
  // with no calculated_price for the current region (e.g. unpriced, or
  // priced in a different region) must not silently drop the whole block.
  const pricedVariants = (product.variants ?? [])
    .map((v) => v.calculated_price)
    .filter(
      (cp): cp is NonNullable<typeof cp> & { calculated_amount: number } =>
        typeof cp?.calculated_amount === "number"
    )

  const variantPrices = pricedVariants.map((cp) => cp.calculated_amount)
  const currencyCode = pricedVariants[0]?.currency_code

  if (!variantPrices.length || !currencyCode) {
    return undefined
  }

  const availability = "https://schema.org/InStock"
  // Google's own examples format Offer.price as a decimal string ("119.99"),
  // not a bare JSON number — matching that convention here.
  const asPriceString = (amount: number) => amount.toFixed(2)

  if (variantPrices.length === 1 || new Set(variantPrices).size === 1) {
    return {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: currencyCode.toUpperCase(),
      price: asPriceString(variantPrices[0]),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    }
  }

  return {
    "@type": "AggregateOffer",
    url: canonicalUrl,
    priceCurrency: currencyCode.toUpperCase(),
    lowPrice: asPriceString(Math.min(...variantPrices)),
    highPrice: asPriceString(Math.max(...variantPrices)),
    offerCount: variantPrices.length,
    availability,
  }
}

// Escapes "<" so the JSON-LD payload can't prematurely close the <script>
// tag (or open another one) if product text ever contains raw HTML-like
// characters. Backslash-escaping "<" is valid JSON and parses identically.
function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const { product } = await getProductByHandle(handle)

  if (!product) {
    return {}
  }

  const canonicalUrl = `${BASE_URL}/products/${product.handle}`
  const description = product.description
    ? product.description.slice(0, 155)
    : `${product.title} — available now at ${STORE_NAME}.`

  return {
    title: `${product.title} | ${STORE_NAME}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.title} | ${STORE_NAME}`,
      description,
      url: canonicalUrl,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const { product, region } = await getProductByHandle(handle)

  if (!product || !region) {
    notFound()
  }

  const { cheapestPrice } = getProductPrice({ product })
  const canonicalUrl = `${BASE_URL}/products/${product.handle}`
  const offers = buildOffers(product, canonicalUrl)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.thumbnail ? [product.thumbnail] : undefined,
    sku: product.variants?.[0]?.sku ?? undefined,
    brand: {
      "@type": "Brand",
      name: STORE_NAME,
    },
    offers,
  }

  return (
    <>
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 py-12">
      <Link href={`/collections/${product.collection?.handle ?? ""}`} className="text-sm text-ui-fg-interactive underline">
        &larr; Back to {product.collection?.title ?? "collection"}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {product.thumbnail && (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>

          {cheapestPrice && (
            <p className="mt-2 text-xl">{cheapestPrice.calculated_price}</p>
          )}

          {product.description && (
            <p className="mt-4 text-ui-fg-subtle">{product.description}</p>
          )}

          {!!product.variants?.length && product.variants.length > 1 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-ui-fg-subtle">
                Available options
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="rounded border px-3 py-1 text-sm"
                  >
                    {variant.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-xs text-ui-fg-muted">SKU: {product.variants?.[0]?.sku}</p>
        </div>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      </main>
    </>
  )
}
