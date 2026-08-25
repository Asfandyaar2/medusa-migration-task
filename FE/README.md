# Altera Onboarding — Next.js Storefront (Day 2)

Minimal storefront on the [Medusa Next.js starter](https://github.com/medusajs/nextjs-starter-medusa),
consuming the [Day 1 backend](../BE/apps/backend/README.md). Two pages: a collection listing and a
product detail page, both at flat, handle-based URLs.

## Stack

- Next.js 15.3.9 (App Router), React 19
- Node 22.15.0 (the starter requires Node 24 LTS or lower — 22.15.0 satisfies both that and the
  backend's requirement)

## Prerequisites

- The [Day 1 backend](../BE/apps/backend/README.md) running at `http://localhost:9000`, seeded
  with the vape catalogue
- Its publishable API key (Admin → Settings → Publishable API Keys)

## Setup

```bash
cd FE
npm install
cp .env.template .env.local
```

Fill in `.env.local`:

```dotenv
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...          # from the backend's admin
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=us
```

`MEDUSA_BACKEND_URL` (no `NEXT_PUBLIC_` prefix) is what's actually read server-side by the data
layer and middleware — despite the name being easy to confuse with the publishable-key var, which
*is* client-exposed. The `.env.template` file documents every other var; the payment/Stripe ones
aren't needed for this task's two read-only pages.

```bash
npm run dev
```

Storefront: **http://localhost:8000**

Two things to check before it'll actually load data:
- Backend running on `:9000` with the vape catalogue seeded
- Backend's `STORE_CORS`/`AUTH_CORS` include `http://localhost:8000` (Day 1's `.env` already has
  this)

## Pages

| Route | Example |
|---|---|
| Collection listing | `/collections/e-liquids`, `/collections/disposable-vapes` |
| Product detail | `/products/naked-100-hawaiian-pog-60ml` |

Unknown handles 404 for real (`notFound()`), not a silently-blank page. So do the bare `/products`
and `/collections` paths themselves — each has its own `page.tsx` that calls `notFound()`, so they
don't fall through to the `[countryCode]` catch-all and render a blank homepage shell.

## Why these routes aren't under `/[countryCode]/...`

The starter ships with `/[countryCode]/products/[handle]` as the default product URL. Left as-is,
every migrated product URL would need a redirect through a country prefix (`/products/x` →
`/us/products/x`) — which is exactly the kind of site-wide rewrite a real Shopify → Medusa
migration is trying to avoid. See [`MIGRATION-APPROACH.md`](../MIGRATION-APPROACH.md) §2 for the
full reasoning.

What changed to fix it:
- `src/app/products/[handle]/page.tsx` and `src/app/collections/[handle]/page.tsx` — new, flat
  routes, outside the `[countryCode]` segment. Region is resolved from
  `NEXT_PUBLIC_DEFAULT_REGION` server-side instead of a URL segment
- `src/middleware.ts` — the region-detection matcher now excludes `/products` and `/collections`,
  so requests to those paths aren't 307'd into `/us/...` before Next's router ever sees them

These are deliberately **new, minimal pages** rather than the starter's full
`ProductTemplate`/`CollectionTemplate` components reused as-is. Those templates render internal
links (via `LocalizedClientLink`) that point back into `/us/products/...` — reusing them wholesale
would mean the pages are reachable at flat URLs directly, but clicking through the UI would still
land on the prefixed ones. The new pages reuse the starter's data-fetching (`lib/data/*`) and price
utilities (`lib/util/get-product-price`), just not the page-level template components, so every
internal link stays on the flat URL scheme.

The rest of the starter's `[countryCode]` tree (cart, checkout, account, etc.) is untouched and
still resolves at its original prefixed paths — it's simply not part of this task's two pages, and
nothing links to it from them.

## SEO on the product page

`generateMetadata` sets:
- `<title>` — `{Product} | MIA Tyson Vape Deals`
- Meta description — the real product description (truncated to ~155 chars), not a placeholder
- `alternates.canonical` — absolute, self-referencing, pointing at the flat URL

Plus a `Product` JSON-LD block (`@context`, `name`, `description`, `sku`, `brand`, `offers`):
- A single `Offer` when a product's variants share one price (true for all 10 products in this
  catalogue right now); `AggregateOffer` with `lowPrice`/`highPrice` if they ever diverge — the
  code checks actual variant prices rather than assuming
- `price` is written as a decimal **string** (`"24.99"`), matching Google's own structured-data
  examples, not a bare JSON number
- The JSON string is escaped (`<` → `<`) before injection via `dangerouslySetInnerHTML`, so
  product text can't prematurely close the `<script>` tag

**To verify:** view-source on any product page, or paste the `<script type="application/ld+json">`
block into [validator.schema.org](https://validator.schema.org) or Google's Rich Results Test.

```bash
curl -s http://localhost:8000/products/naked-100-hawaiian-pog-60ml \
  | grep -o '<script type="application/ld+json">[^<]*</script>'
```

## Assumptions & notes

- **The upstream starter repo itself is marked deprecated** in favour of `medusajs/dtc-starter`
  (the same monorepo the Day 1 backend was scaffolded from). Used anyway per the task's own
  suggestion ("Medusa Next.js starter") — it's still fully functional, just no longer the
  actively-promoted option. Worth knowing if this gets revisited later.
- **No product images seeded on Day 1.** The vape catalogue has no `thumbnail`/`images`, so
  the JSON-LD has no `image` field and product cards render without a photo. `image` is
  *recommended*, not required, for Google's Product rich results — noting it here rather than
  scope-creeping Day 1's seed script to add placeholder images. Collection *descriptions* got the
  equivalent real-content treatment (see the backend README's assumptions) since that was a cheap,
  contained fix; images were a bigger, more speculative one (no real product photography exists
  for this catalogue) so left as a documented gap instead.
- **`next lint` crashes on this project as downloaded, before any change of mine.** Verified by
  temporarily removing this task's added pages and re-running — `next lint` still crashes inside
  `@next/eslint-plugin-next`'s own rules (`no-html-link-for-pages`, `no-page-custom-font`) on
  untouched starter files like `src/app/layout.tsx`. Root cause looks like an `eslint@8.10.0` vs.
  `@next/eslint-plugin-next`'s newer-ESLint-context assumptions mismatch in how the starter pins
  its own devDependencies — pinning `eslint-config-next` to match the installed `next` version
  (15.3.9) didn't fix it either, so it's not simply that. Given `next build` succeeds cleanly and
  `tsc --noEmit` reports zero errors in every file this task added, code quality was verified with
  those two instead of a working `next lint`.
- **Region resolution assumes a single-region store.** `NEXT_PUBLIC_DEFAULT_REGION=us` is read
  directly rather than detected per-request — correct for this task's scope, and the same
  assumption a real single-region storefront migration would make (see `MIGRATION-APPROACH.md`).
- **Don't run `npm run build` and `npm run dev` against the same `.next/` directory at once** —
  found this out directly: doing so mid-session corrupted the Turbopack dev cache (`ENOENT` on
  `_buildManifest.js.tmp.*`, transform errors) and needed `rm -rf .next` plus a clean restart to
  recover. Stop the dev server before building, or build in a separate checkout.
