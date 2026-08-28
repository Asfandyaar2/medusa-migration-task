import { Suspense } from "react"
import Image from "next/image"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { STORE_SHORT_NAME } from "@lib/constants/store"

export default async function Nav({ countryCode }: { countryCode: string }) {
  const [regions, locales, currentLocale, productsResponse] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listProducts({ countryCode, queryParams: { limit: 100 } }),
  ])
  const searchProducts = productsResponse.response.products.map((p) => ({
    id: p.id,
    handle: p.handle!,
    title: p.title!,
  }))

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b border-white/10 bg-brand-navy/90 text-white shadow-lg shadow-black/10 backdrop-blur-md">
        <nav className="content-container txt-xsmall-plus text-white/80 flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                searchProducts={searchProducts}
              />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 font-display txt-compact-xlarge-plus text-white hover:text-brand-sky uppercase"
              data-testid="nav-store-link"
            >
              <Image
                src="/logo-mark.png"
                alt=""
                width={36}
                height={22}
                className="h-6 w-auto rounded-sm"
              />
              {STORE_SHORT_NAME}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-brand-sky"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-brand-sky flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
