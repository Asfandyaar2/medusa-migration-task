import { NICOTINE_WARNING } from "@lib/constants/store"

export default function NicotineWarningStrip() {
  return (
    <div className="overflow-hidden whitespace-nowrap bg-black text-white">
      {/* Continuous right-to-left ticker: the row holds two back-to-back
          copies of the warning and scrolls left by exactly half its own
          width, so the moment the first copy exits, the second is already
          in the identical starting position -- no visible seam or reset. */}
      <div className="flex w-max animate-marquee py-2 motion-reduce:animate-none">
        <span className="mx-6 shrink-0 text-xs font-semibold uppercase tracking-wide">
          {NICOTINE_WARNING}
        </span>
        <span
          className="mx-6 shrink-0 text-xs font-semibold uppercase tracking-wide"
          aria-hidden="true"
        >
          {NICOTINE_WARNING}
        </span>
      </div>
    </div>
  )
}
