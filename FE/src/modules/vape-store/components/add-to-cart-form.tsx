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
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: variant.options?.[0]?.value ?? variant.title ?? "",
      })),
    [variants]
  )

  const handleAddToCart = async () => {
    if (!selectedVariantId) return

    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariantId,
        quantity: 1,
        countryCode: CART_COUNTRY_CODE,
      })
      setJustAdded(true)
      router.refresh()
      setTimeout(() => setJustAdded(false), 2000)
    } finally {
      setIsAdding(false)
    }
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
        disabled={!selectedVariantId || isAdding}
        className="mt-8 rounded-full bg-brand-navy px-8 py-3 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {justAdded
          ? "Added to Cart"
          : isAdding
          ? "Adding..."
          : !selectedVariantId
          ? "Select a Strength"
          : "Add to Cart"}
      </button>
    </div>
  )
}
