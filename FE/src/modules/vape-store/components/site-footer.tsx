import Link from "next/link"
import Image from "next/image"
import {
  NICOTINE_WARNING,
  STORE_NAME,
  STORE_SHORT_NAME,
  STORE_TAGLINE,
} from "@lib/constants/store"

const SHOP_LINKS = [
  { href: "/collections/disposable-vapes", label: "Disposable Vapes" },
  { href: "/collections/e-liquids", label: "E-Liquids" },
  { href: "/blog", label: "Blog" },
]

export default function SiteFooter() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="border-b border-white/10 bg-black/25">
        <p className="content-container py-3 text-center text-[11px] leading-relaxed text-white/60">
          {NICOTINE_WARNING}
        </p>
      </div>

      <div className="content-container grid gap-10 py-12 small:grid-cols-[2fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
            <Image
              src="/logo-mark.png"
              alt=""
              width={36}
              height={22}
              className="h-6 w-auto rounded-sm"
            />
            {STORE_SHORT_NAME}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">{STORE_TAGLINE}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky">
            Shop
          </p>
          <ul className="mt-3 space-y-2">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/80 hover:text-brand-sky"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="content-container flex flex-col gap-1 py-6 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} {STORE_NAME}. All rights
            reserved.
          </p>
          <p>
            Demo storefront built for evaluation purposes — orders use a test
            payment flow only, no real payment is processed.
          </p>
        </div>
      </div>
    </footer>
  )
}
