import Image from "next/image"
import { STORE_NAME } from "@lib/constants/store"

// A dedicated brand moment right under the hero — the same logo mark used
// (small) in every header/footer, shown here at real display size next to
// the full store name.
export default function BrandStrip() {
  return (
    <section className="py-14 small:py-20">
      <div className="content-container flex flex-col items-center justify-center gap-4 text-center">
        <Image
          src="/logo-mark.png"
          alt={STORE_NAME}
          width={320}
          height={200}
          className="h-20 w-auto rounded-2xl shadow-md small:h-28"
        />
        <p className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-brand-navy small:text-4xl">
          {STORE_NAME}
        </p>
      </div>
    </section>
  )
}
