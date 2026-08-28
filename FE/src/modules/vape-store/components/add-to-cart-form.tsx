"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { CART_COUNTRY_CODE } from "@lib/util/cart-region"
import VariantPills from "./variant-pills"

export default function AddToCartForm({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const router = useRouter()
  const variants = product.variants ?? []

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  )
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: variant.options?.[0]?.value ?? variant.title ?? "",
      })),
    [variants]
  )

  // Optimistic: the backend round trip (Vercel -> Railway -> Neon) runs a
  // couple of seconds even on a healthy connection, so waiting for it
  // before showing success makes the button feel stuck. Flip to "Added"
  // immediately and only walk it back if the request actually fails --
  // the real cart (and its count badge elsewhere) still catches up via
  // router.refresh() once the request resolves.
  const handleAddToCart = () => {
    if (!selectedVariantId) return

    setJustAdded(true)
    setError(null)

    addToCart({
      variantId: selectedVariantId,
      quantity: 1,
      countryCode: CART_COUNTRY_CODE,
    })
      .then(() => router.refresh())
      .catch(() => {
        setJustAdded(false)
        setError("Couldn't add to cart — please try again.")
      })

    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div>
      {variants.length > 1 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky">
            Available Strengths
          </h2>
          <VariantPills
            options={variantOptions}
            selectedId={selectedVariantId}
            onSelect={setSelectedVariantId}
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selectedVariantId || justAdded}
        className="mt-8 rounded-full bg-brand-navy px-8 py-3 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {justAdded
          ? "Added to Cart"
          : !selectedVariantId
          ? "Select a Strength"
          : "Add to Cart"}
      </button>
      {error && <p className="mt-2 text-xs text-brand-crimson">{error}</p>}
    </div>
  )
}
