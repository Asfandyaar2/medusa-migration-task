# Altera Onboarding — Medusa v2 Backend (Day 1)

A local Medusa v2 commerce backend seeded with a 10-product vape catalogue across 2 collections,
plus one custom Store API route. Built as the Day 1 deliverable for the Altera / 369 AI Ventures
onboarding task.

## Stack

- **Medusa** v2.19.0 (via `create-medusa-app`, which clones the
  [`dtc-starter`](https://github.com/medusajs/dtc-starter) monorepo — see [Project layout](#project-layout))
- **Node** v22.15.0 (`^20.19.0 || >=22.12.0` required)
- **PostgreSQL** 18, local

## Prerequisites

- Node 20.19+ or 22.12+
- PostgreSQL running locally (the Medusa docs don't state a minimum version; 15+ is the
  practical target)
- Git

## Project layout

`create-medusa-app` no longer scaffolds a flat project — it clones a monorepo. The actual backend
lives one level deeper than you might expect:

```
BE/
├── apps/
│   └── backend/          <-- you are here — everything below is relative to this folder
│       ├── src/
│       │   ├── api/                        custom Store API route (this task's extension)
│       │   ├── migration-scripts/          initial-data-seed.ts (ships with the scaffold)
│       │   └── scripts/seed-vape-catalogue.ts   <-- the vape catalogue seed (this task's data)
│       ├── medusa-config.ts
│       ├── .env                            gitignored — create from .env.template
│       └── package.json
├── package.json           (turborepo root — not used directly in this task)
└── turbo.json
```

**All commands below run from `apps/backend/`.**

## Setup

1. **Install dependencies** (from the monorepo root, `BE/`, so npm workspaces resolve correctly):
   ```bash
   cd BE
   npm install
   ```

2. **Create the database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE altera_medusa_be;"
   ```

3. **Configure environment:**
   ```bash
   cd apps/backend
   cp .env.template .env
   ```
   Then fill in `DATABASE_URL` with your local Postgres credentials and generate a real
   `AUTH_MFA_ENCRYPTION_KEY` (a command for that is in the template). Every variable is documented
   inline in `.env.template` — see that file for the full list and what each one does.

4. **Run migrations** (this also runs the scaffold's own seed — see
   [What the scaffold seeds automatically](#what-the-scaffold-seeds-automatically) below):
   ```bash
   npx medusa db:migrate
   ```

5. **Create an admin user:**
   ```bash
   npx medusa user -e admin@altera.local -p supersecret123
   ```

6. **Seed the vape catalogue:**
   ```bash
   npm run seed:vape
   ```
   This removes the scaffold's 4 demo products, adds a "United States" region (the scaffold only
   creates a "Europe"/EUR one — see [Assumptions & notes](#assumptions--notes)), and creates the 10
   vape products across 2 collections. Safe to re-run — it detects existing data and skips rather
   than duplicating.

7. **Start the server:**
   ```bash
   npm run dev
   ```

## URLs

| | |
|---|---|
| Backend API | http://localhost:9000 |
| Admin dashboard | http://localhost:9000/app |

Log in with the admin user created in step 5.

## The publishable API key

Medusa v2 requires a publishable API key on **every** `/store/*` request — including this
project's custom route. Without it you get a `400`, not a `401`, which reads like a malformed
request rather than a missing credential.

The scaffold's own seed already creates and links one — you don't need to create anything:

1. Admin → **Settings → Publishable API Keys**
2. Copy the value for **"Default Publishable API Key"**

Every request needs:
```
-H "x-publishable-api-key: pk_..."
```

## What the scaffold seeds automatically

Running `db:migrate` (step 4) auto-runs the starter's own seed script, which creates — **before**
`seed:vape` touches anything:

- A **"Default Sales Channel"**
- A **"Default Publishable API Key"**, already linked to it
- A **"Default Store"** with `usd` enabled alongside the default `eur`
- A **"Europe"** region (`eur`)
- A **"Default Shipping Profile"**
- 4 demo products (T-Shirt, Sweatshirt, Sweatpants, Shorts) — **removed by `seed:vape`**

## Data model

10 products across 2 collections:

| Collection | Products | Variants |
|---|---|---|
| `disposable-vapes` | 5 disposable vapes | 1 each (`Title: Default Title`) |
| `e-liquids` | 5 e-liquids | 3 each, by `Nicotine Strength` (3mg / 6mg / 12mg) |

The e-liquids' nicotine-strength variants are what the custom route below filters on — a real
domain distinction (disposables don't have a strength choice), not one invented for the exercise.

All prices are USD, set on the variant. `manage_inventory: false` throughout — Day 1 only needs
products to be **listable**, not purchasable, and skipping inventory levels keeps the seed script
focused. Every product is `PUBLISHED` and linked to the Default Sales Channel; unpublished or
unlinked products don't appear in the Store API at all.

## Store API — verified calls

```bash
PK="pk_..."   # from Settings → Publishable API Keys

# List
curl -H "x-publishable-api-key: $PK" "http://localhost:9000/store/products?limit=20"

# Retrieve by handle — there is no GET /store/products/:handle; filter instead
curl -H "x-publishable-api-key: $PK" \
  "http://localhost:9000/store/products?handle=naked-100-hawaiian-pog-60ml"

# Calculated price — needs a region matching the variant's price currency.
# The scaffold's default region is Europe/EUR; this catalogue is priced in USD,
# so use the "United States" region seed:vape creates (grab its id from /store/regions).
curl -H "x-publishable-api-key: $PK" \
  "http://localhost:9000/store/regions"
curl -H "x-publishable-api-key: $PK" \
  "http://localhost:9000/store/products?region_id=reg_...&fields=*variants.calculated_price"
```

## Custom addition — `GET /store/vape-products`

**Files:** `src/api/store/vape-products/{route.ts,validators.ts}`, `src/api/middlewares.ts`

A Store API route that lists products filtered by collection and/or nicotine strength:

```bash
curl -H "x-publishable-api-key: $PK" \
  "http://localhost:9000/store/vape-products?collection_handle=e-liquids&nicotine_strength=6mg&limit=10&offset=0"
```

```json
{ "vape_products": [ ... ], "count": 5, "limit": 10, "offset": 0 }
```

**Why this addition:** it's the piece a storefront actually consumes directly, and it's a genuine
extension point rather than a toy — collection and nicotine-strength filtering are both real
questions a vape storefront's listing page needs answered. Filtering, field selection, and
pagination all push down to the database through Medusa's Query graph (`query.graph(...)`)
rather than being fetched in full and filtered in the handler. Query params are validated by
`validateAndTransformQuery` + a `createFindParams`-based zod schema, so the handler receives typed,
already-coerced input instead of parsing `req.query` by hand.

## Assumptions & notes

- **`create-medusa-app@2.19.0` scaffolds a monorepo, not a flat project** — it clones
  [`dtc-starter`](https://github.com/medusajs/dtc-starter), landing the actual backend at
  `apps/backend/`. Every path in this README accounts for that; a v1-era Medusa tutorial would
  suggest paths one level shallower.
- **The scaffold only seeds a "Europe"/EUR region.** Since this catalogue is priced in USD,
  `seed:vape` explicitly creates a "United States" region so `region_id`-based price lookups have
  something to resolve against.
- **The scaffold's 4 demo products (T-Shirt, Sweatshirt, etc.) are deleted by `seed:vape`**, so the
  catalogue is exactly the 10 vape products this task asks for, not 14 mixed ones. They're
  soft-deleted (`deleted_at` set), not hard-deleted.
- **Every product needs at least one option, even single-variant ones** — Medusa's
  `createProductsWorkflow` validation rejects a product with variants but no `options`. The
  disposables use a `Title: "Default Title"` placeholder option, mirroring how Shopify handles
  variant-less products.
- **Zod is imported from `@medusajs/framework/zod`, not the bare `zod` package** — this changed in
  Medusa 2.13.0. The bare package is still a transitive dependency of the starter, but importing
  from it directly is the outdated pattern.
- **`REDIS_URL` in `.env` currently has no effect** — `medusa-config.ts` never reads it into
  `projectConfig`, confirmed by the dev server logging "redisUrl not found. A fake redis instance
  will be used" regardless of the env var. Left unset in practice; documented in `.env.template`.
- **Local PostgreSQL 18 worked with no issues.** The Medusa docs don't state a version requirement
  at all (checked directly) — the only version signal anywhere is the Docker guide's
  `postgres:15-alpine`, which is why 15+ is called out above as a practical target rather than a
  documented one.
- **Stuck-on note:** `create-medusa-app` refuses to scaffold into an existing directory — even an
  empty one — and on this machine the target folder couldn't be deleted and recreated because the
  IDE held it open as the workspace root. Worked around by scaffolding into a throwaway directory
  name and moving its contents into the real one afterward.
