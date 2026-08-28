"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeftMini, ChevronRightMini } from "@medusajs/icons"
import { ProductCardData } from "@lib/util/to-card-product"
import { useIntersection } from "@lib/hooks/use-in-view"
import ProductCard from "./product-card"

export default function ProductCarousel({
  products,
}: {
  products: ProductCardData[]
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(wrapperRef, "-80px")
  // Latched, not live — otherwise scrolling this carousel out of view and
  // back (it's a horizontally-scrollable element near the reveal threshold)
  // would re-trigger the opacity-0 state and flicker the cards.
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  useEffect(() => {
    if (inView) setHasBeenVisible(true)
  }, [inView])

  const scrollByAmount = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className={`w-[70%] shrink-0 snap-start xsmall:w-[45%] small:w-[30%] medium:w-[22%] ${
              hasBeenVisible ? "animate-fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        aria-label="Scroll left"
        className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-navy/20 bg-white text-brand-navy shadow-sm transition-colors hover:bg-brand-silver small:flex"
      >
        <ChevronLeftMini />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        aria-label="Scroll right"
        className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-navy/20 bg-white text-brand-navy shadow-sm transition-colors hover:bg-brand-silver small:flex"
      >
        <ChevronRightMini />
      </button>
    </div>
  )
}
