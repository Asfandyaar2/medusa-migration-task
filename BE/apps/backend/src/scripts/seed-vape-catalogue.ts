import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  deleteCollectionsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"

type NicotineStrength = "3mg" | "6mg" | "12mg"

type DisposableSeed = {
  title: string
  handle: string
  description: string
  priceUsd: number
}

type ELiquidSeed = {
  title: string
  handle: string
  description: string
  priceUsd: number
  strengths: NicotineStrength[]
}

const DEMO_PRODUCT_HANDLES = ["t-shirt", "sweatshirt", "sweatpants", "shorts"]

const DISPOSABLE_VAPES: DisposableSeed[] = [
  {
    title: "Elf Bar BC5000 — Blue Razz Ice",
    handle: "elf-bar-bc5000-blue-razz-ice",
    description:
      "A 5000-puff disposable vape delivering a cold blue raspberry finish with a smooth mesh-coil draw from first hit to last.",
    priceUsd: 17.99,
  },
  {
    title: "Lost Mary OS5000 — Watermelon Cherry",
    handle: "lost-mary-os5000-watermelon-cherry",
    description:
      "A dual-fruit watermelon and cherry blend in a compact 5000-puff disposable with consistent flavor through the full charge.",
    priceUsd: 18.99,
  },
  {
    title: "Geek Bar Pulse — Miami Mint",
    handle: "geek-bar-pulse-miami-mint",
    description:
      "A crisp menthol-forward mint disposable with a dual-mesh coil for a cooler, more even draw than a standard single-coil bar.",
    priceUsd: 21.99,
  },
  {
    title: "RAZ TN9000 — Peach Mango Watermelon",
    handle: "raz-tn9000-peach-mango-watermelon",
    description:
      "A three-fruit peach, mango, and watermelon blend in a long-lasting 9000-puff disposable built for all-day rotation.",
    priceUsd: 19.99,
  },
  {
    title: "Funky Republic Ti7000 — Blue Razz Ice",
    handle: "funky-republic-ti7000-blue-razz-ice",
    description:
      "A menthol-cooled blue raspberry disposable with a 7000-puff rating and a display screen for remaining battery and e-liquid.",
    priceUsd: 16.99,
  },
]

const E_LIQUIDS: ELiquidSeed[] = [
  {
    title: "Naked 100 Hawaiian POG — 60ml",
    handle: "naked-100-hawaiian-pog-60ml",
    description:
      "A passionfruit, orange, and guava blend from Naked 100's original line, bottled at 60ml across three nicotine strengths.",
    priceUsd: 24.99,
    strengths: ["3mg", "6mg", "12mg"],
  },
  {
    title: "Vapetasia Killer Kustard — 100ml",
    handle: "vapetasia-killer-kustard-100ml",
    description:
      "A custard e-liquid built around a rich vanilla base, one of Vapetasia's longest-running flavors, in a 100ml bottle.",
    priceUsd: 27.99,
    strengths: ["3mg", "6mg", "12mg"],
  },
  {
    title: "Coastal Clouds Mango Berries — 60ml",
    handle: "coastal-clouds-mango-berries-60ml",
    description:
      "A mango and mixed-berry e-liquid from Coastal Clouds' fruit line, bottled at 60ml across three nicotine strengths.",
    priceUsd: 22.99,
    strengths: ["3mg", "6mg", "12mg"],
  },
  {
    title: "Air Factory Blue Razz — 100ml",
    handle: "air-factory-blue-razz-100ml",
    description:
      "A straightforward blue raspberry e-liquid from Air Factory's core range, bottled at 100ml across three nicotine strengths.",
    priceUsd: 25.99,
    strengths: ["3mg", "6mg", "12mg"],
  },
  {
    title: "Jam Monster Blueberry — 100ml",
    handle: "jam-monster-blueberry-100ml",
    description:
      "A blueberry jam on buttered toast e-liquid from Jam Monster's dessert line, bottled at 100ml across three nicotine strengths.",
    priceUsd: 26.99,
    strengths: ["3mg", "6mg", "12mg"],
  },
]

// ProductCollection has no `description` column (unlike ProductCategory) —
// confirmed against the DML schema in @medusajs/product. Storing the
// storefront-facing blurb in metadata instead, so the collection page can
// use real copy rather than a generic "Shop the X collection" template.
const DISPOSABLES_COLLECTION = {
  title: "Disposable Vapes",
  handle: "disposable-vapes",
  metadata: {
    description:
      "Ready-to-use disposable vapes — no refilling, no coils to change. Pick a flavor and go.",
  },
}

const E_LIQUIDS_COLLECTION = {
  title: "E-Liquids",
  handle: "e-liquids",
  metadata: {
    description:
      "Bottled e-liquids for refillable devices, each available in 3mg, 6mg, and 12mg nicotine strength.",
  },
}

// No real product photography exists for this catalogue — these are
// generated placeholder SVGs (see FE/public/products/), served by the
// storefront itself. Absolute URL because the thumbnail is stored here on
// the backend but rendered by a separate app (the storefront) — a bare
// relative path would be ambiguous about which origin it's relative to.
const STOREFRONT_BASE_URL =
  process.env.STOREFRONT_BASE_URL ?? "http://localhost:8000"

function thumbnailFor(handle: string): string {
  return `${STOREFRONT_BASE_URL}/products/${handle}.svg`
}

function slugUpper(handle: string): string {
  return handle.toUpperCase()
}

export default async function seedVapeCatalogue({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!defaultSalesChannel) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Default Sales Channel not found — run `npx medusa db:migrate` before seeding."
    )
  }

  const {
    data: [shippingProfile],
  } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  if (!shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No shipping profile found — expected the core migration to have created a default one."
    )
  }

  // --- 1. Remove the scaffold's demo products, so the catalogue is exactly the vape products below ---
  const { data: demoProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: DEMO_PRODUCT_HANDLES },
  })
  if (demoProducts.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: demoProducts.map((p) => p.id) },
    })
    logger.info(
      `Removed ${demoProducts.length} scaffold demo product(s): ${demoProducts
        .map((p) => p.handle)
        .join(", ")}`
    )
  } else {
    logger.info("No scaffold demo products found — already removed.")
  }

  // --- 2. Ensure a "United States" region exists (the scaffold only seeds "Europe"/eur) ---
  const { data: existingUsRegions } = await query.graph({
    entity: "region",
    fields: ["id"],
    filters: { name: "United States" },
  })

  let usRegionId: string
  if (existingUsRegions.length) {
    usRegionId = existingUsRegions[0].id
    logger.info(`"United States" region already exists (${usRegionId}).`)
  } else {
    const { result: regions } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
    usRegionId = regions[0].id
    logger.info(`Created "United States" region (${usRegionId}).`)
  }

  // --- 3. Clean slate for the vape catalogue itself ---
  // Products reference collections by ID, so if either is going to be
  // recreated (e.g. to pick up a description change), both must be — a
  // guard that reused an existing collection while creating a *different*
  // instance of the other, or vice versa, would leave products pointing at
  // stale/mismatched IDs. Recreating both together, every time either is
  // missing, keeps this simple and avoids that class of bug.
  const allHandles = [
    ...DISPOSABLE_VAPES.map((p) => p.handle),
    ...E_LIQUIDS.map((p) => p.handle),
  ]
  const { data: existingVapeProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: allHandles },
  })
  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
    filters: {
      handle: [DISPOSABLES_COLLECTION.handle, E_LIQUIDS_COLLECTION.handle],
    },
  })

  if (existingVapeProducts.length || existingCollections.length) {
    if (existingVapeProducts.length) {
      await deleteProductsWorkflow(container).run({
        input: { ids: existingVapeProducts.map((p) => p.id) },
      })
    }
    if (existingCollections.length) {
      await deleteCollectionsWorkflow(container).run({
        input: { ids: existingCollections.map((c) => c.id) },
      })
    }
    logger.info(
      `Cleared ${existingVapeProducts.length} existing vape product(s) and ` +
        `${existingCollections.length} existing vape collection(s) before reseeding.`
    )
  }

  // --- 4. Collections (always created fresh here — see note above) ---
  const { result: collections } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [DISPOSABLES_COLLECTION, E_LIQUIDS_COLLECTION],
    },
  })
  const disposablesCollectionId = collections.find(
    (c) => c.handle === DISPOSABLES_COLLECTION.handle
  )!.id
  const eLiquidsCollectionId = collections.find(
    (c) => c.handle === E_LIQUIDS_COLLECTION.handle
  )!.id
  logger.info(
    `Created collections: ${DISPOSABLES_COLLECTION.handle}, ${E_LIQUIDS_COLLECTION.handle}`
  )

  // --- 5. Products ---
  const disposableProducts = DISPOSABLE_VAPES.map((p) => ({
    title: p.title,
    handle: p.handle,
    description: p.description,
    thumbnail: thumbnailFor(p.handle),
    status: ProductStatus.PUBLISHED,
    collection_id: disposablesCollectionId,
    shipping_profile_id: shippingProfile.id,
    sales_channels: [{ id: defaultSalesChannel.id }],
    // Every product needs at least one option, even a single-variant one —
    // Medusa has no notion of a variant-less product (mirrors Shopify's "Default Title").
    options: [{ title: "Title", values: ["Default Title"] }],
    variants: [
      {
        title: "Single",
        sku: `${slugUpper(p.handle)}-SINGLE`,
        manage_inventory: false,
        options: { Title: "Default Title" },
        prices: [{ amount: p.priceUsd, currency_code: "usd" }],
      },
    ],
  }))

  const eLiquidProducts = E_LIQUIDS.map((p) => ({
    title: p.title,
    handle: p.handle,
    description: p.description,
    thumbnail: thumbnailFor(p.handle),
    status: ProductStatus.PUBLISHED,
    collection_id: eLiquidsCollectionId,
    shipping_profile_id: shippingProfile.id,
    sales_channels: [{ id: defaultSalesChannel.id }],
    options: [
      {
        title: "Nicotine Strength",
        values: p.strengths,
      },
    ],
    variants: p.strengths.map((strength) => ({
      title: `${p.title} — ${strength}`,
      sku: `${slugUpper(p.handle)}-${strength.toUpperCase()}`,
      manage_inventory: false,
      options: { "Nicotine Strength": strength },
      prices: [{ amount: p.priceUsd, currency_code: "usd" }],
    })),
  }))

  await createProductsWorkflow(container).run({
    input: {
      products: [...disposableProducts, ...eLiquidProducts],
    },
  })

  logger.info(
    `Seeded ${disposableProducts.length + eLiquidProducts.length} vape products ` +
      `(${disposableProducts.length} disposables, ${eLiquidProducts.length} e-liquids) ` +
      `across 2 collections. Region "United States" (${usRegionId}) is ready for calculated_price lookups.`
  )
}
