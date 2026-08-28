import { Metadata } from "next"

import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { toCardProductFromStore } from "@lib/util/to-card-product"
import { STORE_NAME, STORE_TAGLINE } from "@lib/constants/store"
import Hero from "@modules/vape-store/components/hero"
import BrandStrip from "@modules/vape-store/components/brand-strip"
import CollectionShowcase, {
  ShowcaseCollection,
} from "@modules/vape-store/components/collection-showcase"
import SectionHeading from "@modules/vape-store/components/section-heading"
import ProductCarousel from "@modules/vape-store/components/product-carousel"
import TrustBadges from "@modules/vape-store/components/trust-badges"
import RevealOnScroll from "@modules/vape-store/components/reveal-on-scroll"

const COLLECTION_HANDLES = ["disposable-vapes", "e-liquids"] as const

export const metadata: Metadata = {
  title: STORE_NAME,
  description: STORE_TAGLINE,
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const collections = (
    await Promise.all(
      COLLECTION_HANDLES.map((handle) => getCollectionByHandle(handle))
    )
  ).filter(Boolean)

  const collectionSections = await Promise.all(
    collections.map(async (collection) => {
      const { response } = await listProducts({
        countryCode,
        queryParams: { collection_id: [collection.id], limit: 100 },
      })
      return {
        collection,
        products: response.products.map(toCardProductFromStore),
      }
    })
  )

  const showcaseCollections: ShowcaseCollection[] = collectionSections.map(
    ({ collection, products }) => ({
      handle: collection.handle,
      title: collection.title,
      description: (collection.metadata?.description as string) || undefined,
      thumbnails: products
        .map((p) => p.thumbnail)
        .filter((t): t is string => !!t)
        .slice(0, 2),
    })
  )

  return (
    <>
      <Hero />

      <RevealOnScroll>
        <BrandStrip />
      </RevealOnScroll>

      <RevealOnScroll>
        <CollectionShowcase collections={showcaseCollections} />
      </RevealOnScroll>

      {collectionSections.map(({ collection, products }, index) => (
        <RevealOnScroll
          key={collection.id}
          className={
            index % 2 === 0
              ? "block bg-white py-16 small:py-20"
              : "block bg-brand-navy py-16 small:py-20"
          }
        >
          <div className="content-container">
            <SectionHeading
              eyebrow={`${products.length} Products`}
              title={collection.title}
              description={(collection.metadata?.description as string) || undefined}
              tone={index % 2 === 0 ? "light" : "dark"}
            />
            <div className="mt-8">
              <ProductCarousel products={products} />
            </div>
          </div>
        </RevealOnScroll>
      ))}

      <RevealOnScroll className="block">
        <TrustBadges />
      </RevealOnScroll>
    </>
  )
}
