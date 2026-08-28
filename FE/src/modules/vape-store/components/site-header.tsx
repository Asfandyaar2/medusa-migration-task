"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BarsThree, XMark } from "@medusajs/icons"
import { STORE_SHORT_NAME } from "@lib/constants/store"

const NAV_LINKS = [
  { href: "/collections/disposable-vapes", label: "Disposable Vapes" },
  { href: "/collections/e-liquids", label: "E-Liquids" },
  { href: "/blog", label: "Blog" },
]

// Shared across this task's four flat pages (home, listing, product, cart) —
// not the starter's untouched [countryCode] tree. A client component purely
// for the mobile drawer's open/close state; the nav links themselves are
// plain server-renderable <Link>s. cartItemCount is fetched server-side by
// each page (SiteHeader can't fetch it itself and stay a client component).
export default function SiteHeader({
  cartItemCount = 0,
}: {
  cartItemCount?: number
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/90 text-white shadow-lg shadow-black/10 backdrop-blur-md">
      <div className="content-container relative flex items-center justify-between py-4">
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          className="small:hidden -ml-2 flex h-10 w-10 items-center justify-center text-white"
        >
          {mobileNavOpen ? <XMark /> : <BarsThree />}
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight small:static small:translate-x-0 absolute left-1/2 -translate-x-1/2"
        >
          <Image
            src="/logo-mark.png"
            alt=""
            width={36}
            height={22}
            className="h-6 w-auto rounded-sm"
          />
          {STORE_SHORT_NAME}
        </Link>

        <nav className="hidden small:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:text-brand-sky"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand-sky transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
          <Link
            href="/cart"
            className="group relative text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:text-brand-sky"
          >
            Cart ({cartItemCount})
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand-sky transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        {/* On mobile the cart link lives in the drawer below (see nav-links
            list) rather than here, so this spacer can stay a fixed width
            matching the hamburger button — keeping the centered logo
            actually centered regardless of "Cart (N)"'s variable width. */}
        <span className="small:hidden h-10 w-10" aria-hidden="true" />
      </div>

      {mobileNavOpen && (
        <nav className="small:hidden border-t border-white/10 bg-brand-navy-dark">
          <ul className="content-container flex flex-col py-2">
            {[...NAV_LINKS, { href: "/cart", label: `Cart (${cartItemCount})` }].map(
              (link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="block py-3 text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-brand-sky"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
