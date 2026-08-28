import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { listVapeProducts } from "@lib/data/vape-products"
import {
  ProductCardData,
  toCardProductFromStore,
  toCardProductFromVape,
} from "@lib/util/to-card-product"
import { STORE_NAME } from "@lib/constants/store"
import SiteHeader from "@modules/vape-store/components/site-header"
import SiteFooter from "@modules/vape-store/components/site-footer"
import NicotineWarningStrip from "@modules/vape-store/components/nicotine-warning-strip"
import SectionHeading from "@modules/vape-store/components/section-heading"
import ProductGrid from "@modules/vape-store/components/product-grid"
import { getCartItemCount } from "@modules/vape-store/components/cart-count-badge"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const NICOTINE_STRENGTHS = ["3mg", "6mg", "12mg"]

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ nicotine_strength?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    return {}
  }

  const canonicalUrl = `${BASE_URL}/collections/${collection.handle}`
  const metadataDescription = (collection.metadata?.description as string) || undefined
  const description =
    metadataDescription ?? `Shop the ${collection.title} collection at ${STORE_NAME}.`

  return {
    title: `${collection.title} | ${STORE_NAME}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params
  const { nicotine_strength: nicotineStrength } = await searchParams
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    notFound()
  }

  let products: ProductCardData[]
  let count: number

  if (nicotineStrength) {
    // Filtered via the strength picker below — this is this task's custom
    // Day 1 route (GET /store/vape-products), not the standard Store API.
    const { vape_products, count: vapeCount } = await listVapeProducts({
      collectionHandle: collection.handle,
      nicotineStrength,
    })
    count = vapeCount
    products = vape_products.map(toCardProductFromVape)
  } else {
    const { response } = await listProducts({
      countryCode: DEFAULT_REGION,
      queryParams: {
        collection_id: [collection.id],
        limit: 100,
      },
    })
    count = response.count
    products = response.products.map(toCardProductFromStore)
  }

  const description = (collection.metadata?.description as string) || undefined
  const cartItemCount = await getCartItemCount()

  return (
    <>
      <NicotineWarningStrip />
      <SiteHeader cartItemCount={cartItemCount} />
      <main className="content-container py-12">
        <SectionHeading
          eyebrow={`${count} Products`}
          title={collection.title}
          description={description}
          tone="light"
        />

        {collection.handle === "e-liquids" && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-grey-50">
              Nicotine strength:
            </span>
            <Link
              href="/collections/e-liquids"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                !nicotineStrength
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-brand-navy/30 text-brand-navy hover:border-brand-navy"
              }`}
            >
              All
            </Link>
            {NICOTINE_STRENGTHS.map((strength) => (
              <Link
                key={strength}
                href={`/collections/e-liquids?nicotine_strength=${strength}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  nicotineStrength === strength
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-brand-navy/30 text-brand-navy hover:border-brand-navy"
                }`}
              >
                {strength}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <ProductGrid
            products={products}
            className="grid-cols-2 small:grid-cols-3 medium:grid-cols-4"
          />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
