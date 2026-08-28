import { NICOTINE_WARNING } from "@lib/constants/store"

export default function NicotineWarningStrip() {
  return (
    <div className="bg-black text-white">
      <p className="mx-auto max-w-3xl px-6 py-4 text-center text-lg font-semibold uppercase leading-snug tracking-wide">
        {NICOTINE_WARNING}
      </p>
    </div>
  )
}
