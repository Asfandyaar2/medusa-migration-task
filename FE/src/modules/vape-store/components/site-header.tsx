import Link from "next/link"

const STORE_NAME = "MIA Tyson Vape Deals"

// Shared across this task's two flat pages only (not the starter's
// untouched [countryCode] tree) — gives a way back to the catalogue from
// a product page, since / now redirects straight into it rather than
// landing on a distinct "home" page.
export default function SiteHeader() {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          {STORE_NAME}
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/collections/disposable-vapes">Disposable Vapes</Link>
          <Link href="/collections/e-liquids">E-Liquids</Link>
        </nav>
      </div>
    </header>
  )
}
