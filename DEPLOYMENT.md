# Deploying to Railway + Neon + Vercel

Where each piece goes:

| Piece | Platform | Why |
|---|---|---|
| Postgres | **Neon** | Managed, serverless-friendly Postgres; free tier is enough for this catalogue |
| Medusa v2 backend (`BE/apps/backend`) | **Railway** | Long-running Node process (Medusa isn't serverless-shaped) |
| Next.js storefront (`FE`) | **Vercel** | Native Next.js hosting |

**Do these in order.** The backend's CORS settings and the seed script's thumbnail URLs both
need to know the storefront's domain *before* you run migrations/seed — so you fix the
storefront's domain name first, then deploy the backend, then point the storefront at it.

Repo: `git@github.com:Asfandyaar2/medusa-migration-task.git`, branch `main` (already has both
days' work merged in). Railway and Vercel will both connect straight to this GitHub repo.

## 0. Before you start

Two code changes were needed to make this deployable (neither works only-on-localhost, both
are now in the working tree, not yet committed):

1. **`BE/apps/backend/medusa-config.ts`** — added `databaseDriverOptions.connection.ssl` (only
   when `NODE_ENV=production`). Neon's TLS cert chain isn't trusted by Node's default CA bundle
   in every environment; without this you get `self-signed certificate in certificate chain` on
   every DB query in production. Doesn't touch local dev (guarded by `NODE_ENV`).
2. **`FE/next.config.js`** — added `*.vercel.app` to `images.remotePatterns`. Product thumbnails
   are seeded as **absolute URLs pointing at the storefront's own domain**
   (`STOREFRONT_BASE_URL` + `/products/<handle>.svg`), so `next/image` treats them as remote and
   refuses to render them unless the domain is allow-listed — this would otherwise silently
   break every product image in production.

Also, running `npm install` locally to verify both apps run refreshed `BE/package-lock.json` and
`FE/package-lock.json` (routine dependency-resolution churn, not a functional change).

Commit and push all of this before connecting Railway/Vercel — both platforms build from
whatever's on `main`:

```bash
git add BE/apps/backend/medusa-config.ts FE/next.config.js BE/package-lock.json FE/package-lock.json
git commit -m "chore: production DB SSL + allow storefront's own domain for next/image"
git push origin main
```

## 1. Neon — Postgres

1. [neon.tech](https://neon.tech) → sign up → **New Project**. Any region; picking the one
   closest to where you'll deploy Railway shaves a few ms off every query.
2. Use the default `neondb` database (or create one named e.g. `altera_medusa`).
3. **Dashboard → Connection Details → copy the connection string.** Use the **direct** connection
   (not the `-pooler` one) — Medusa is a single long-running process with its own connection
   pool, so you don't need PgBouncer, and the direct string avoids a class of prepared-statement
   quirks some ORMs hit through the pooler. It already includes `?sslmode=require`:
   ```
   postgresql://neondb_owner:<password>@ep-xxxx-xxxx.<region>.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this tab open — it's `DATABASE_URL` in step 3.

Neon free-tier databases **auto-suspend after inactivity**. The first query after a quiet period
takes an extra second or two while it wakes up — normal, not a bug.

## 2. Reserve your Vercel project name (do this before Railway)

Vercel's production domain is `https://<project-name>.vercel.app`, fixed the moment you name the
project — you don't need to deploy first to know it.

1. [vercel.com](https://vercel.com) → **Add New → Project → Import** your GitHub repo.
2. **Root Directory: `FE`**.
3. Before clicking Deploy, set the **Project Name** (top of the import screen) to something
   available, e.g. `cirrus-vapor-storefront`. Your domain is now fixed:
   `https://cirrus-vapor-storefront.vercel.app`.
4. Add placeholder env vars so the build doesn't crash on missing-env-var checks (real values go
   in later, in step 4):
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_placeholder
   MEDUSA_BACKEND_URL=http://localhost:9000
   NEXT_PUBLIC_BASE_URL=https://cirrus-vapor-storefront.vercel.app
   NEXT_PUBLIC_DEFAULT_REGION=us
   ```
5. Click **Deploy**. It's fine if this first build is the one that ends up superseded later —
   the point right now is only to lock in the domain name.

Note it down: **`STOREFRONT_URL = https://cirrus-vapor-storefront.vercel.app`** (substitute your
actual project name everywhere below).

## 3. Railway — Backend

### 3.1 Create the service

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → this repo.
2. Service **Settings → Source → Root Directory: `BE/apps/backend`**.
3. Settings → Deploy:
   - **Build Command:** `npm run build && cd .medusa/server && npm install`
   - **Start Command:** `cd .medusa/server && npx medusa db:migrate && npm run start`

   **Why `cd .medusa/server` at all:** `medusa build` doesn't produce a directly-runnable app in
   place — it writes a second, self-contained copy of the server (its own `package.json`, compiled
   `src`, and the built admin dashboard under `public/admin/index.html`) into `.medusa/server`,
   which needs its own `npm install` to actually be runnable (it ships no `node_modules` of its
   own). Running `medusa start` from the project root instead of from `.medusa/server` is what
   caused this exact deployment's first successful-build-but-crashing-boot: it threw "Could not
   find index.html in the admin build directory" because Railway's build and runtime steps don't
   reliably share the same filesystem the way a local machine does, so `.medusa/server`'s contents
   didn't carry over into whatever context `npm run start` (from the root) ran in — verified by
   reproducing it fixed locally: `medusa start` from the root works fine on a single local
   filesystem, but the officially-documented `.medusa/server` pattern is what's actually reliable
   across a real build→deploy boundary like Railway's.

   **Why `db:migrate` is chained into Start, not skipped:** without it, the very first boot (and
   any future deploy that adds a migration) queries tables that don't exist yet and the process
   crashes on startup — this is what happened the *second* time this was deployed, before the
   `.medusa/server` fix above. `db:migrate` only applies *pending* migrations, so it's a fast no-op
   on every deploy where the schema's already current — safe to leave in permanently. If your
   Railway plan exposes a separate **Pre-Deploy Command** field, that's the more "correct" home for
   this same command (run from `.medusa/server` there too); functionally equivalent to chaining it
   into Start.

### 3.2 Environment variables

Settings → Variables. Generate fresh secrets — **don't reuse the local `.env` values**, especially
`JWT_SECRET`/`COOKIE_SECRET`, which the local `.env.template` explicitly calls out as
local-only:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # run 3x
```

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the Neon connection string from step 1 |
| `STORE_CORS` | `https://cirrus-vapor-storefront.vercel.app` |
| `ADMIN_CORS` | Railway's own public domain (see 3.3 — add this after the first deploy, or use `https://*.up.railway.app` as a placeholder first) |
| `AUTH_CORS` | `https://cirrus-vapor-storefront.vercel.app` |
| `JWT_SECRET` | freshly generated |
| `COOKIE_SECRET` | freshly generated |
| `AUTH_MFA_ENCRYPTION_KEY` | freshly generated (64 hex chars) |
| `MEDUSA_ADMIN_ONBOARDING_TYPE` | `default` |
| `STOREFRONT_BASE_URL` | `https://cirrus-vapor-storefront.vercel.app` (used by the seed script to build thumbnail URLs — must be set **before** you run `seed:vape` in 3.4) |

Multiple origins in a CORS var are comma-separated, no spaces (matches the local `.env` pattern).

### 3.3 First deploy

Push/redeploy. Railway assigns a public domain automatically — **Settings → Networking →
Generate Domain** if it hasn't already, e.g. `altera-medusa-be-production.up.railway.app`. Go
back and set `ADMIN_CORS` to this exact URL, then redeploy.

Confirm it booted:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<your-railway-domain>/health   # expect 200
```

### 3.4 Migrate, create admin, seed

Run these **against the deployed service** (same env vars, same Neon DB) using the Railway CLI —
Railway doesn't have a Heroku-style release phase, so one-off commands are the way to run these:

```bash
npm install -g @railway/cli
railway login
railway link          # pick this project + the backend service
railway run npx medusa db:migrate
railway run npx medusa user -e admin@yourdomain.com -p <a-real-password>
railway run npm run seed:vape
```

`db:migrate` also runs the scaffold's own seed (default sales channel, EUR region, publishable
key) the same way it did locally — see `BE/apps/backend/README.md` for what that creates.
`seed:vape` then replaces the 4 demo products with the 10-product vape catalogue and writes
thumbnail URLs against `STOREFRONT_BASE_URL`, which is why that variable has to be correct
*before* this runs. If you set it wrong, just re-run `seed:vape` — it's idempotent (rebuilds the
catalogue fresh every time, see the backend README's "Setup" step 6).

### 3.5 Get the publishable key

```bash
railway run node -e "
const {Client} = require('pg');
const c = new Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
c.connect().then(() => c.query(\"SELECT token FROM api_key WHERE type='publishable' LIMIT 1\"))
  .then(r => console.log(r.rows[0].token)).finally(() => c.end());
"
```
(or: log into `https://<your-railway-domain>/app` with the admin user from 3.4 → Settings →
Publishable API Keys.)

### 3.6 Verify the backend directly

```bash
PK="pk_..."   # from 3.5
BACKEND="https://<your-railway-domain>"

curl -s -H "x-publishable-api-key: $PK" "$BACKEND/store/products?limit=3"
curl -s -H "x-publishable-api-key: $PK" \
  "$BACKEND/store/vape-products?collection_handle=e-liquids&nicotine_strength=6mg"
```
Both should return real product JSON, matching what you saw running this locally.

## 4. Vercel — Storefront

Back in the Vercel project from step 2, **Settings → Environment Variables**, replace the
placeholders with real values:

| Variable | Value |
|---|---|
| `MEDUSA_BACKEND_URL` | `https://<your-railway-domain>` (no `NEXT_PUBLIC_` prefix — server-side only) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | from 3.5 |
| `NEXT_PUBLIC_BASE_URL` | `https://cirrus-vapor-storefront.vercel.app` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `us` |
| `REVALIDATE_SECRET` | any random string |

**Deployments → ⋯ → Redeploy** (env var changes need a redeploy to take effect; they don't
apply retroactively to the build that's already live).

### Verify

```bash
BASE="https://cirrus-vapor-storefront.vercel.app"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/collections/e-liquids"     # 200
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/products/naked-100-hawaiian-pog-60ml"  # 200
```
Then open both in a browser: check product images actually load (this is what the `next.config.js`
fix in step 0 was for), and click the 3mg/6mg/12mg filter on `/collections/e-liquids` to exercise
the custom `/store/vape-products` route end-to-end.

## 5. If you picked a different domain than you planned

If the Vercel project name you actually got differs from what you told Railway in 3.2/3.4:
1. Update `STORE_CORS`, `AUTH_CORS`, `STOREFRONT_BASE_URL` on Railway to the real domain, redeploy.
2. Re-run `railway run npm run seed:vape` (idempotent — safe to re-run) so thumbnail URLs point
   at the right host.
3. Update `NEXT_PUBLIC_BASE_URL` on Vercel to match, redeploy.

## 6. Optional follow-ups

- **Custom domain:** once you attach one in Vercel, add it to `STORE_CORS`/`AUTH_CORS` on
  Railway and to `images.remotePatterns` in `next.config.js` (the `*.vercel.app` wildcard only
  covers Vercel's own domains).
- **Change the admin password** created in 3.4 from the throwaway one used to set it up.
- **Redis:** not required — this deployment uses Medusa's in-memory event bus/locking, same as
  local dev, which is fine for a single Railway instance. Only add Railway's Redis plugin (and
  wire `REDIS_URL` into `medusa-config.ts`, which currently ignores it — see the backend README's
  assumptions) if you scale to multiple instances.
- **Cost:** Neon and Vercel both have usable free tiers for this scale. Railway is usage-billed
  after its trial credit — a single small Node service here runs a few dollars/month, not free
  indefinitely.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend crashes on boot with a TLS/cert error | Neon SSL cert chain | Confirm `NODE_ENV=production` is actually set on Railway (the fix in `medusa-config.ts` is gated on it) |
| `/store/*` returns `400` | Missing/wrong `x-publishable-api-key` header | Re-fetch the key per 3.5 — it's regenerated by `seed:vape` only if you clear and reseed keys, but confirm you're using the one from *this* deployment's DB, not a local one |
| Storefront pages 500 / can't reach backend | `MEDUSA_BACKEND_URL` wrong, or `STORE_CORS`/`AUTH_CORS` don't include the Vercel domain | Check Railway logs; check the exact URL (scheme + no trailing slash) matches in both places |
| Product images broken (broken-image icon) | Vercel domain not in `images.remotePatterns`, or `STOREFRONT_BASE_URL` was wrong when `seed:vape` ran | Confirm the `*.vercel.app` entry deployed (redeploy if you only just added it); re-run `seed:vape` if the domain was wrong at seed time |
| Price shows `0` or missing on storefront | Region mismatch — this catalogue is USD-priced but the scaffold's default region is EUR | Confirm `seed:vape` ran (it creates the "United States" region) and `NEXT_PUBLIC_DEFAULT_REGION=us` is set on Vercel |
