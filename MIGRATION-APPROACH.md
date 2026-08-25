# Shopify → Medusa Migration Approach

How to move a Shopify storefront (`/products/[handle]`, `/collections/[handle]`) onto this
Medusa/Next.js stack without losing indexed URLs or search rankings.

## 1. Inventory before mapping

You can't preserve what you haven't enumerated. Pull from all of these — each surfaces URLs the
others miss:

- **Shopify `sitemap.xml`** (and its nested sitemaps) — the canonical set of indexable URLs
- **Google Search Console → Pages** — what's *actually indexed*, including URLs missing from the
  sitemap or blocked after the fact
- **GA4 landing pages** (last 12 months) — prioritise by real traffic, not guesswork
- **A crawl** (Screaming Frog or similar) — internal links, existing redirects, current canonicals
- **Backlink export** (GSC Links report / Ahrefs) — externally-linked URLs are the expensive ones
  to break

Shopify URL shapes worth checking for specifically, because they're easy to miss:
- `/collections/[collection]/products/[handle]` — Shopify's nested product URL. It canonicalises
  to `/products/[handle]`, but it still gets linked and indexed
- `/products/[handle]?variant=123` — variant deep links
- `/collections/all`, tag-filtered collections (`/collections/x/tag-y`)
- `/pages/*`, `/blogs/*/*` — content with no direct Medusa equivalent

## 2. Mapping

**Default is 1:1.** A handle that migrates verbatim needs no redirect at all — this project's own
storefront proves the point: `/products/naked-100-hawaiian-pog-60ml` and
`/collections/e-liquids` work as final URLs, not redirect sources, specifically *because* the
Medusa product/collection handles were set to match what a Shopify slug would have been.

That's a deliberate build decision, not a given: the official Medusa Next.js starter routes
`/[countryCode]/products/[handle]` by default. Left as-is, every migrated product URL would
redirect through a country prefix — a site-wide rewrite, which is the opposite of what a 1:1
migration should look like. This project's storefront routes `/products/[handle]` and
`/collections/[handle]` directly (see `FE/README.md` for how), and region is resolved server-side
instead of from the URL. For a real multi-region storefront that genuinely needs
locale-prefixed URLs, the honest version of this migration keeps the region *out of the path*
(cookie or `Accept-Language`-based) specifically to protect this property.

Non-1:1 cases and where they go:
| Case | Target |
|---|---|
| Discontinued product | Its parent collection — **not** the homepage. A dead product redirected to the homepage reads to Google as a soft 404 |
| Merged / renamed product | The surviving product's new handle |
| Handle normalised (case, stopwords) | The new handle |
| Nested `/collections/x/products/y` | Flat `/products/y` |
| `?variant=` deep link | The product page, ideally with the variant preselected |
| `/pages/*`, `/blogs/*` | Nearest equivalent content, or explicitly out of scope for v1 — say which |

Store the map as **data** (a CSV/table: `old_path, new_path, status, reason`), not as inline code —
it's reviewable, diffable, and reusable across the next store in the portfolio.

## 3. Single-hop 301s, no chains

- **301, not 302.** A 302 doesn't consolidate ranking signal the way a 301 does
- **Resolve the map transitively before deploy.** If `A→B` and `B→C` both exist in the map, ship
  `A→C` and `B→C` — collapse chains at build time, don't let them reach production
- **Normalise once, at the edge, before matching**: trailing slash, case, tracking params
  (`?utm_*`). Inconsistent normalisation is the most common accidental chain — `/x/` → `/x` →
  `/products/x` is two hops when it should be one
- **One canonical host+scheme, one hop.** `http://www` → `https://` (non-www) must not be
  protocol-then-host as two separate redirects
- **Implementation:** `next.config.js` `redirects()` for a static map (fast, needs a rebuild to
  change) or edge middleware backed by the map for a large/dynamic set (no rebuild, adds a small
  amount of latency). This project's `middleware.ts` already does per-request routing logic
  (region detection) — the redirect map would live alongside it as one more lookup, not a second
  system
- **CI check:** a script that walks the map and fails the build on any chain or cycle. This is what
  keeps "we don't chain redirects" true after the fifth person edits the map, not just on day one

## 4. Sitemap regeneration

- Generate dynamically from Medusa data (`next-sitemap.js`, already present in this starter,
  or `app/sitemap.ts`) — never hand-maintained
- Include only canonical, 200-returning URLs. **A redirect source in the sitemap is a crawl-budget
  leak and a quality signal against you** — never list `/collections/x/products/y` if it 301s to
  `/products/y`
- Accurate `lastmod` per URL
- Point `robots.txt` at the new sitemap, submit it in GSC immediately
- Leave the *old* Shopify sitemap reachable for a short window post-cutover — that's what gets
  Google to re-crawl the old URLs and actually discover the new redirects, rather than waiting for
  organic re-crawl

## 5. Cutover and validation

**Cutover (zero-downtime):**
- Drop DNS TTL 24–48h ahead of the switch
- Stand up Medusa/Next in parallel on a crawl-blocked staging host (`noindex` + basic auth), and
  dry-run the entire redirect map against it before touching DNS
- Keep the old Shopify store reachable on a temporary subdomain through the cutover window — that's
  the rollback path
- Decide the rollback criteria and who calls it *before* cutover night, not during it

**Validation (the part that's easy to hand-wave, so be concrete):**
- Replay the full inventoried URL list against production. Every URL must be either a 200, or a
  **single-hop** 301 to a 200 — fail the run on any chain, loop, 404, or 5xx. This is the same
  script as the CI redirect-map check in §3; run it again post-cutover against the real domain
- Spot-check canonicals are self-referencing and absolute on a sample of 200s
- Validate structured data on a sample of product pages (Rich Results Test, or the JSON-LD checks
  this project already runs — see `FE/README.md`)
- GSC: watch Coverage/Pages for a 404 spike, Sitemaps for read errors, request re-indexing on the
  top URLs by traffic
- **Server/edge logs for 2–4 weeks post-cutover** — this is how you catch the URLs your inventory
  missed. Route each new 404 you see into the redirect map as it appears, don't wait for a batch
  review
- Track rankings and organic sessions for the top ~50 URLs against a pre-cutover baseline. Expect a
  small, temporary dip — decide in advance what counts as "more than that," so it's not a live
  argument during the dip
- Re-check Core Web Vitals post-migration — a new stack can regress performance even when every URL
  is correct

## What I'd automate for the next migration

The repeatable version of this is three scripts, not three days of manual QA:
1. **Inventory diff** — sitemap + GSC + crawl → one deduplicated URL list, automatically
2. **Redirect-map validator** — the chain/cycle/200-or-single-301 check, runnable in CI and against
   production
3. **Sitemap generator** — already effectively required by §4, just needs to run on every deploy

Once those three exist, store #3 in the portfolio costs a fraction of what store #2 did.
