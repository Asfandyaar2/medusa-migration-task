"use client"

import { Popover, PopoverPanel, Portal, Transition } from "@headlessui/react"
import {
  ArrowRightMini,
  BarsThree,
  BuildingStorefront,
  House,
  MagnifyingGlass,
  ShoppingBag,
  User,
  XMark,
} from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import { STORE_NAME, STORE_SHORT_NAME } from "@lib/constants/store"

const SideMenuItems = [
  { name: "Home", href: "/", icon: House },
  { name: "Store", href: "/store", icon: BuildingStorefront },
  { name: "Account", href: "/account", icon: User },
  { name: "Cart", href: "/cart", icon: ShoppingBag },
]

// Real collection links (same two collections the header nav and hero CTAs
// point at) — filling the panel's leftover vertical space with genuinely
// useful shortcuts rather than blank space or pure decoration.
const QuickCollectionLinks = [
  { name: "Disposable Vapes", href: "/collections/disposable-vapes" },
  { name: "E-Liquids", href: "/collections/e-liquids" },
]

export type SearchableProduct = {
  id: string
  handle: string
  title: string
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  searchProducts?: SearchableProduct[]
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  searchProducts = [],
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return searchProducts
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, searchProducts])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  aria-label="Menu"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-brand-sky"
                >
                  <BarsThree />
                </Popover.Button>
              </div>

              {/* Portal escapes the header's own backdrop-blur ancestor —
                  without it, this panel's position:fixed resolves against
                  that blurred header (which establishes a new containing
                  block per the CSS filter/backdrop-filter spec) instead of
                  the real viewport, collapsing it to the header's height. */}
              <Portal>
                {open && (
                  <div
                    className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                    onClick={close}
                    data-testid="side-menu-backdrop"
                  />
                )}

                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0"
                  enterTo="opacity-100 backdrop-blur-2xl"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 backdrop-blur-2xl"
                  leaveTo="opacity-0"
                  afterLeave={() => setQuery("")}
                >
                {/* Full length on every breakpoint now — a fixed, edge-to-edge
                    panel on mobile, and a full-viewport-height (minus a small
                    margin) floating card on sm+, rather than shrinking to
                    whatever its content happens to need. */}
                <PopoverPanel className="fixed inset-0 z-[51] flex flex-col sm:inset-2 sm:w-2/5 sm:min-w-min 2xl:w-1/3 text-sm text-ui-fg-on-color backdrop-blur-2xl">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex h-full flex-col overflow-y-auto rounded-none bg-[rgba(3,7,18,0.9)] p-6 sm:rounded-rounded sm:bg-[rgba(3,7,18,0.85)]"
                  >
                    {/* Top: brand + search, visually grouped and separated
                        from the nav below by a hairline divider. */}
                    <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-white">
                          <Image
                            src="/logo-mark.png"
                            alt=""
                            width={36}
                            height={22}
                            className="h-6 w-auto rounded-sm"
                          />
                          {STORE_SHORT_NAME}
                        </span>
                        <button
                          data-testid="close-menu-button"
                          onClick={close}
                          aria-label="Close menu"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <XMark />
                        </button>
                      </div>

                      <div className="relative">
                        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        <input
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full rounded-full border border-white/20 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 transition-colors focus:border-brand-sky focus:outline-none"
                          data-testid="side-menu-search-input"
                        />
                        {results.length > 0 && (
                          <ul className="absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg">
                            {results.map((product) => (
                              <li key={product.id}>
                                <Link
                                  href={`/products/${product.handle}`}
                                  onClick={close}
                                  className="block rounded-lg px-3 py-2 text-sm text-brand-navy hover:bg-brand-silver"
                                >
                                  {product.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                        {query.trim() && results.length === 0 && (
                          <div className="absolute inset-x-0 top-full z-10 mt-2 rounded-2xl bg-white p-3 text-sm text-grey-50 shadow-lg">
                            No products match &quot;{query}&quot;.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: primary nav + a "shop by collection" block,
                        vertically centered together in whatever space is
                        left. Splitting this into two real content groups
                        (instead of one short list alone) is what keeps the
                        full-length panel from reading as mostly empty. */}
                    <div className="flex flex-1 flex-col justify-center gap-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative flex h-16 items-center justify-center">
                          {/* Soft blurred "vapor cloud" glow behind the mark —
                              on-brand for a vape store, and a nicer frame for a
                              photo-based logo than a hard edge would be. */}
                          <div className="absolute h-14 w-32 rounded-full bg-brand-sky/25 blur-2xl" />
                          <Image
                            src="/logo-mark.png"
                            alt=""
                            width={72}
                            height={45}
                            className="relative h-9 w-auto rounded-md opacity-90"
                          />
                        </div>
                        <span className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                          {STORE_NAME}
                        </span>
                      </div>

                      <ul className="flex flex-col items-start gap-2">
                        {SideMenuItems.map(({ name, href, icon: Icon }, index) => (
                          <li key={name} className="w-full">
                            <LocalizedClientLink
                              href={href}
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                              className="group flex animate-fade-in-up items-center gap-4 rounded-xl px-3 py-2.5 text-2xl leading-tight text-white opacity-0 transition-colors hover:bg-white/[0.06] hover:text-brand-sky"
                              style={{ animationDelay: `${index * 60}ms` }}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-sky transition-colors group-hover:bg-brand-sky/20">
                                <Icon className="h-5 w-5" />
                              </span>
                              {name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>

                      <div className="flex animate-fade-in-up flex-col gap-3 border-t border-white/10 pt-8 opacity-0" style={{ animationDelay: "240ms" }}>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                          Shop by Collection
                        </span>
                        <div className="flex flex-col gap-1">
                          {QuickCollectionLinks.map(({ name, href }) => (
                            <Link
                              key={name}
                              href={href}
                              onClick={close}
                              className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-brand-sky"
                            >
                              {name}
                              <ArrowRightMini className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-sky" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: locale/region utilities + copyright, pinned to
                        the foot of the panel and separated by a divider. */}
                    <div className="flex flex-col gap-y-4 border-t border-white/10 pt-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small text-white/50">
                        © {new Date().getFullYear()} {STORE_NAME}. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
                </Transition>
              </Portal>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
