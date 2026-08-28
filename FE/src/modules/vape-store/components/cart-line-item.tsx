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
  const [isUpdating, setIsUpdating] = useState(false)

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1) return
    setIsUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
    router.refresh()
    setIsUpdating(false)
  }

  const remove = async () => {
    setIsUpdating(true)
    await deleteLineItem(item.id)
    router.refresh()
  }

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
              disabled={isUpdating}
              onClick={() => changeQuantity(item.quantity - 1)}
              className="h-8 w-8 text-brand-navy disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => changeQuantity(item.quantity + 1)}
              className="h-8 w-8 text-brand-navy disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={remove}
            className="text-xs font-semibold uppercase tracking-wide text-grey-50 underline hover:text-brand-crimson disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>

      <p className="whitespace-nowrap font-display text-sm font-bold text-brand-navy">
        {convertToLocale({
          amount: item.total ?? item.unit_price * item.quantity,
          currency_code: currencyCode,
        })}
      </p>
    </li>
  )
}
