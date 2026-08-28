import Image from "next/image"
import Link from "next/link"
import SectionHeading from "./section-heading"

export type ShowcaseCollection = {
  handle: string
  title: string
  description?: string
  thumbnails: string[]
}

export default function CollectionShowcase({
  collections,
}: {
  collections: ShowcaseCollection[]
}) {
  return (
    <section className="bg-brand-silver py-16 small:py-20">
      <div className="content-container">
        <SectionHeading
          eyebrow="Shop the Lineup"
          title="Our Two Collections"
          tone="light"
        />

        <div className="mt-10 grid gap-6 small:grid-cols-2">
          {collections.map((collection) => (
            <Link
              key={collection.handle}
              href={`/collections/${collection.handle}`}
              className="group overflow-hidden rounded-2xl border border-brand-navy/15 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid grid-cols-2 gap-1 bg-gradient-to-br from-neutral-900 to-neutral-950 p-1.5">
                {collection.thumbnails.slice(0, 2).map((thumbnail) => (
                  <div
                    key={thumbnail}
                    className="relative aspect-square overflow-hidden rounded-lg bg-white"
                  >
                    <Image
                      src={thumbnail}
                      alt=""
                      fill
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 20vw, 40vw"
                    />
                  </div>
                ))}
              </div>

              <div className="p-6">
                <p className="font-display text-xl font-bold uppercase tracking-tight text-brand-navy">
                  {collection.title}
                </p>
                {collection.description && (
                  <p className="mt-2 text-sm leading-relaxed text-grey-60">
                    {collection.description}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-navy px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Shop Collection
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
