import { BadgeCheck, Check, MagnifyingGlass, ShieldCheck } from "@medusajs/icons"
import SectionHeading from "./section-heading"

// Only claims that are actually true for a read-only demo catalogue with no
// real fulfillment or payment processing behind it — deliberately omits the
// reference site's shipping/checkout-security/verified-seal badges, since
// this storefront doesn't do any of that.
const BADGES = [
  {
    icon: BadgeCheck,
    title: "Trusted Brands",
    description: "A curated lineup of disposable and e-liquid brands, not an open marketplace.",
  },
  {
    icon: Check,
    title: "Clear Labeling",
    description: "Every e-liquid lists its nicotine strength up front — no digging through variants.",
  },
  {
    icon: ShieldCheck,
    title: "21+ Compliance",
    description: "Nicotine warnings and age messaging built into every page, not an afterthought.",
  },
  {
    icon: MagnifyingGlass,
    title: "Simple Browsing",
    description: "Two collections, ten products — find what you're looking for in a couple of clicks.",
  },
]

export default function TrustBadges() {
  return (
    <section className="bg-brand-navy py-16 small:py-20">
      <div className="content-container">
        <SectionHeading
          eyebrow="Why Shop With Us"
          title="Built for Simple Browsing"
          tone="dark"
        />

        <div className="mt-10 grid gap-6 small:grid-cols-2 large:grid-cols-4">
          {BADGES.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/[0.18] bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sky/[0.12] text-brand-sky transition-transform duration-300 group-hover:scale-110">
                <Icon />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
