import Image from "next/image"
import Link from "next/link"
import { ProductCardData } from "@lib/util/to-card-product"

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block overflow-hidden rounded-2xl bg-brand-silver shadow-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-brand-glow"
    >
      {product.thumbnail && (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white p-6">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-110"
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 50vw"
            />
            {/* Diagonal light gleam that sweeps across on hover — pure CSS,
                no second image needed, so it can't misrepresent the product
                the way swapping in an unrelated lifestyle photo would. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[220%] -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-[400%]"
            />
          </div>
        </div>
      )}

      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold text-brand-navy">
          {product.title}
        </p>
        {product.priceLabel && (
          <p className="mt-2 font-display text-lg font-bold text-brand-navy">
            {product.priceLabel}
          </p>
        )}
        <span className="mt-3 inline-block rounded-full bg-brand-navy px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-sky group-hover:text-brand-navy">
          View Details
        </span>
      </div>
    </Link>
  )
}
