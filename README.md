# Altera Onboarding Task — Medusa Migration

Two-day onboarding task for Altera / 369 AI Ventures: stand up a Medusa v2 backend, seed a vape
product catalogue, expose it through a minimal storefront, and write up the Shopify → Medusa
URL/redirect migration approach.

## Layout

Single mono-repo. `BE/` and `FE/` are siblings, each independently runnable:

```
Task1/
├── BE/                     Day 1 — Medusa v2 backend
│   └── apps/backend/       the actual Medusa app (see BE/apps/backend/README.md)
├── FE/                     Day 2 — Next.js storefront (added Day 2)
└── MIGRATION-APPROACH.md   Day 2 — Shopify → Medusa redirect/SEO write-up (added Day 2)
```

## Running this locally

Each app has its own README with exact setup steps:

- **Backend:** [`BE/apps/backend/README.md`](BE/apps/backend/README.md) — Medusa v2, seeded with
  10 vape products across 2 collections, plus a custom `GET /store/vape-products` filter route.
- **Storefront:** `FE/README.md` (Day 2)

Start the backend first — the storefront reads from it.

## Branches

Each day's work lives on its own branch, kept unmerged so the branch history itself is visible:

- `feat/day1-medusa-backend` — backend
- `feat/day2-storefront` — storefront + migration note (Day 2)

`main` stays minimal until the task is submitted.
