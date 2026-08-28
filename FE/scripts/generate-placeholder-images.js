// No real product photography exists for this catalogue. Generates a
// distinct placeholder SVG per product into public/products/<handle>.svg.
// Run with: node scripts/generate-placeholder-images.js
// Re-run BE's `npm run seed:vape` afterward — its seed replaces existing
// vape products/collections rather than skipping them, so new thumbnail
// URLs are picked up on every seed run.
const fs = require("fs")
const path = require("path")

const OUT_DIR = path.resolve(__dirname, "../public/products")

const DISPOSABLES = [
  { handle: "elf-bar-bc5000-blue-razz-ice", title: "Elf Bar BC5000", sub: "Blue Razz Ice", color: "#2563eb" },
  { handle: "lost-mary-os5000-watermelon-cherry", title: "Lost Mary OS5000", sub: "Watermelon Cherry", color: "#dc2626" },
  { handle: "geek-bar-pulse-miami-mint", title: "Geek Bar Pulse", sub: "Miami Mint", color: "#0d9488" },
  { handle: "raz-tn9000-peach-mango-watermelon", title: "RAZ TN9000", sub: "Peach Mango Watermelon", color: "#ea580c" },
  { handle: "funky-republic-ti7000-blue-razz-ice", title: "Funky Republic Ti7000", sub: "Blue Razz Ice", color: "#4338ca" },
]

const ELIQUIDS = [
  { handle: "naked-100-hawaiian-pog-60ml", title: "Naked 100", sub: "Hawaiian POG — 60ml", color: "#f59e0b" },
  { handle: "vapetasia-killer-kustard-100ml", title: "Vapetasia", sub: "Killer Kustard — 100ml", color: "#a16207" },
  { handle: "coastal-clouds-mango-berries-60ml", title: "Coastal Clouds", sub: "Mango Berries — 60ml", color: "#be185d" },
  { handle: "air-factory-blue-razz-100ml", title: "Air Factory", sub: "Blue Razz — 100ml", color: "#1d4ed8" },
  { handle: "jam-monster-blueberry-100ml", title: "Jam Monster", sub: "Blueberry — 100ml", color: "#6d28d9" },
]

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Designed to sit inside ProductCard/PDP's white image tile (see
// FE/src/modules/vape-store/components/product-card.tsx) — a white canvas
// with a colored "capsule" silhouette, not a full-bleed dark card, so it
// doesn't fight the surrounding white-tile-on-dark-backdrop treatment.
function svgFor({ title, sub, color }) {
  const t = escapeXml(title)
  const s = escapeXml(sub)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="capsule" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="#ffffff"/>
  <rect x="310" y="140" width="180" height="440" rx="90" fill="url(#capsule)"/>
  <rect x="330" y="170" width="40" height="200" rx="20" fill="#ffffff" fill-opacity="0.35"/>
  <text x="400" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#0F1F4A">${t}</text>
  <text x="400" y="702" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#0F1F4A" fill-opacity="0.7">${s}</text>
  <text x="400" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#9CA3AF">Placeholder image — no product photography available</text>
</svg>`
}

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const p of [...DISPOSABLES, ...ELIQUIDS]) {
  const file = path.join(OUT_DIR, `${p.handle}.svg`)
  fs.writeFileSync(file, svgFor(p))
  console.log("wrote", file)
}
