import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { listVapeProducts } from "@lib/data/vape-products"
import { firstPrice } from "@lib/util/vape-price"
import SiteHeader from "@modules/vape-store/components/site-header"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const STORE_NAME = "MIA Tyson Vape Deals"
const NICOTINE_STRENGTHS = ["3mg", "6mg", "12mg"]

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ nicotine_strength?: string }>
}

type CardProduct = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  priceLabel: string | null
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

  let products: CardProduct[]
  let count: number

  if (nicotineStrength) {
    // Filtered via the strength picker below — this is this task's custom
    // Day 1 route (GET /store/vape-products), not the standard Store API.
    const { vape_products, count: vapeCount } = await listVapeProducts({
      collectionHandle: collection.handle,
      nicotineStrength,
    })
    count = vapeCount
    products = vape_products.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      thumbnail: p.thumbnail,
      priceLabel: p.variants?.[0] ? firstPrice(p.variants[0]) : null,
    }))
  } else {
    const { response } = await listProducts({
      countryCode: DEFAULT_REGION,
      queryParams: {
        collection_id: [collection.id],
        limit: 100,
      },
    })
    count = response.count
    products = response.products.map((p) => ({
      id: p.id,
      handle: p.handle!,
      title: p.title!,
      thumbnail: p.thumbnail ?? null,
      priceLabel: getProductPrice({ product: p }).cheapestPrice?.calculated_price ?? null,
    }))
  }

  return (
    <>
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">{collection.title}</h1>
        <p className="mt-1 text-ui-fg-subtle">{count} products</p>

        {collection.handle === "e-liquids" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ui-fg-subtle">
              Filter by nicotine strength (custom API route):
            </span>
            <Link
              href="/collections/e-liquids"
              className={`rounded border px-3 py-1 ${!nicotineStrength ? "bg-black text-white" : ""}`}
            >
              All
            </Link>
            {NICOTINE_STRENGTHS.map((strength) => (
              <Link
                key={strength}
                href={`/collections/e-liquids?nicotine_strength=${strength}`}
                className={`rounded border px-3 py-1 ${
                  nicotineStrength === strength ? "bg-black text-white" : ""
                }`}
              >
                {strength}
              </Link>
            ))}
          </div>
        )}

        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.handle}`} className="block group">
                {product.thumbnail && (
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(min-width: 768px) 25vw, 50vw"
                    />
                  </div>
                )}
                <p className="mt-2 text-sm font-medium">{product.title}</p>
                {product.priceLabel && (
                  <p className="text-sm text-ui-fg-subtle">{product.priceLabel}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
