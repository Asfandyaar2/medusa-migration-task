import { Metadata } from "next"
import Link from "next/link"
import { retrieveCart } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { STORE_NAME } from "@lib/constants/store"
import { getCartItemCount } from "@modules/vape-store/components/cart-count-badge"
import NicotineWarningStrip from "@modules/vape-store/components/nicotine-warning-strip"
import SiteHeader from "@modules/vape-store/components/site-header"
import SiteFooter from "@modules/vape-store/components/site-footer"
import SectionHeading from "@modules/vape-store/components/section-heading"
import CartLineItem from "@modules/vape-store/components/cart-line-item"

export const metadata: Metadata = {
  title: `Cart | ${STORE_NAME}`,
}

export default async function CartPage() {
  const cart = await retrieveCart()
  const cartItemCount = await getCartItemCount()
  const items = cart?.items ?? []

  return (
    <>
      <NicotineWarningStrip />
      <SiteHeader cartItemCount={cartItemCount} />
      <main className="content-container py-12">
        <SectionHeading eyebrow="Your Order" title="Cart" tone="light" />

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-brand-navy/10 bg-brand-silver p-10 text-center">
            <p className="text-sm text-grey-60">Your cart is empty.</p>
            <Link
              href="/collections/e-liquids"
              className="mt-4 inline-block rounded-full bg-brand-navy px-6 py-3 text-xs font-bold uppercase tracking-wide text-white hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 small:grid-cols-[2fr_1fr]">
            <ul>
              {items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  currencyCode={cart!.currency_code}
                />
              ))}
            </ul>

            <div className="h-fit rounded-2xl border border-brand-navy/10 bg-brand-silver p-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-brand-navy">
                Summary
              </h2>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-grey-60">Subtotal</span>
                <span className="font-semibold text-brand-navy">
                  {convertToLocale({
                    amount: cart!.item_subtotal ?? cart!.subtotal,
                    currency_code: cart!.currency_code,
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-grey-50">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                href="/us/checkout"
                className="mt-6 block rounded-full bg-brand-navy px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-white hover:opacity-90"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
