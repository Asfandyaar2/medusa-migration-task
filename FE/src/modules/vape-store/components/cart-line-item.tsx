"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { updateLineItem, deleteLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"

export default function CartLineItem({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) {
  const router = useRouter()
  // Optimistic: quantity/removal update on screen immediately, the real
  // mutation (Vercel -> Railway -> Neon, a couple of seconds even when
  // healthy) runs in the background and only gets walked back if it
  // actually fails. router.refresh() still runs once it resolves, so the
  // real cart totals/count catch up shortly after.
  const [quantity, setQuantity] = useState(item.quantity)
  const [removed, setRemoved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = (nextQuantity: number) => {
    if (nextQuantity < 1) return
    const previousQuantity = quantity
    setQuantity(nextQuantity)
    setError(null)

    updateLineItem({ lineId: item.id, quantity: nextQuantity })
      .then(() => router.refresh())
      .catch(() => {
        setQuantity(previousQuantity)
        setError("Couldn't update quantity — try again.")
      })
  }

  const remove = () => {
    setRemoved(true)
    setError(null)

    deleteLineItem(item.id)
      .then(() => router.refresh())
      .catch(() => {
        setRemoved(false)
        setError("Couldn't remove item — try again.")
      })
  }

  if (removed) return null

  return (
    <li className="flex gap-4 border-b border-brand-navy/10 py-6">
      <Link
        href={item.product_handle ? `/products/${item.product_handle}` : "#"}
        className="shrink-0"
      >
        {item.thumbnail && (
          <div className="h-20 w-20 overflow-hidden rounded-lg bg-white p-2 ring-1 ring-brand-navy/10">
            <div className="relative h-full w-full">
              <Image
                src={item.thumbnail}
                alt={item.product_title ?? ""}
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={item.product_handle ? `/products/${item.product_handle}` : "#"}
            className="text-sm font-semibold text-brand-navy hover:text-brand-sky"
          >
            {item.product_title}
          </Link>
          {item.variant?.title && (
            <p className="text-xs text-grey-50">{item.variant.title}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-brand-navy/30">
            <button
              type="button"
              onClick={() => changeQuantity(quantity - 1)}
              className="h-8 w-8 text-brand-navy disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="w-6 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => changeQuantity(quantity + 1)}
              className="h-8 w-8 text-brand-navy disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            className="text-xs font-semibold uppercase tracking-wide text-grey-50 underline hover:text-brand-crimson disabled:opacity-40"
          >
            Remove
          </button>
        </div>
        {error && <p className="text-xs text-brand-crimson">{error}</p>}
      </div>

      <p className="whitespace-nowrap font-display text-sm font-bold text-brand-navy">
        {convertToLocale({
          // Derived from the optimistic quantity rather than item.total,
          // which still reflects the pre-update quantity until
          // router.refresh() catches up a moment later.
          amount: item.unit_price * quantity,
          currency_code: currencyCode,
        })}
      </p>
    </li>
  )
}
