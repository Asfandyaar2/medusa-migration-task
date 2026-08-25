import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const STORE_NAME = "MIA Tyson Vape Deals"

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    return {}
  }

  const canonicalUrl = `${BASE_URL}/collections/${collection.handle}`
  const description = `Shop the ${collection.title} collection at ${STORE_NAME}.`

  return {
    title: `${collection.title} | ${STORE_NAME}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    notFound()
  }

  const { response } = await listProducts({
    countryCode: DEFAULT_REGION,
    queryParams: {
      collection_id: [collection.id],
      limit: 100,
    },
  })

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold">{collection.title}</h1>
      <p className="mt-1 text-ui-fg-subtle">{response.count} products</p>

      <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {response.products.map((product) => {
          const { cheapestPrice } = getProductPrice({ product })

          return (
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
                {cheapestPrice && (
                  <p className="text-sm text-ui-fg-subtle">
                    {cheapestPrice.calculated_price}
                  </p>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
