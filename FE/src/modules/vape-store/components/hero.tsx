"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeftMini, ChevronRightMini } from "@medusajs/icons"

// Real photography (licensed Unsplash device/device-lineup shots) used as
// full-bleed atmosphere behind our own headline copy — never as a specific
// product's thumbnail. A generic device photo labeled as a specific named
// SKU (e.g. "Elf Bar BC5000") would misrepresent that product; here it's
// backdrop for OUR brand messaging, same boundary phase 2 established.
const SLIDES = [
  {
    image: "/hero/slide-1.jpg",
    // Landscape source (8688x5792) — default centering already frames the
    // device well, minimal crop needed against a 16:9 box.
    objectPosition: "center 35%",
    eyebrow: "Multi-Brand Vape Shop",
    title: "A tight, curated lineup of disposables & e-liquids",
    description:
      "No endless scrolling — just the disposable and e-liquid brands worth stocking, with clear nicotine-strength labeling on every bottle.",
    ctaLabel: "Shop All",
    ctaHref: "/collections/e-liquids",
  },
  {
    image: "/hero/slide-2.jpg",
    objectPosition: "center",
    eyebrow: "Ready to Use",
    title: "Disposable vapes, no refilling required",
    description:
      "Pick a flavor and go — five disposable lines, no coils to change, no e-liquid to pour.",
    ctaLabel: "Shop Disposables",
    ctaHref: "/collections/disposable-vapes",
  },
  {
    image: "/hero/slide-3.jpg",
    // Portrait source (4450x6675) cropped into a wide 16:9 box — object-cover
    // has to zoom in a lot regardless of position, so this just picks the
    // least-cropped, most-recognizable part of the frame (upper-mid, where
    // the device sits) rather than dead center.
    objectPosition: "center 20%",
    eyebrow: "Refillable Devices",
    title: "E-liquids in three nicotine strengths",
    description:
      "5 bottled e-liquid lines, each available at 3mg, 6mg, and 12mg — labeled clearly, every time.",
    ctaLabel: "Shop E-Liquids",
    ctaHref: "/collections/e-liquids",
  },
]

const AUTO_ADVANCE_MS = 5000

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  // The slide that was active immediately before the current one. It's the
  // only index (besides activeIndex) allowed to play the exit animation --
  // every other slide just sits at rest (opacity-0, no animation running),
  // so a slide can never flash into view on mount or replay stale motion
  // later.
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  // Bumped on every real slide change (auto-advance or manual). While a
  // slide is active, its single animated wrapper below is keyed on this
  // value, so React remounts it -- and therefore replays the
  // hero-slide-in animation from 0% -- every time that slide (re)becomes
  // active, including a viewer re-clicking the progress segment for the
  // slide already on screen.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (isPaused) return
    // Re-runs (restarting the countdown) on every tick/activeIndex change --
    // including changes from a manual prev/next/dot click -- so the
    // progress bar always shows the real time left until the next
    // auto-advance, instead of drifting out of sync with it.
    const timer = setTimeout(() => {
      setPreviousIndex(activeIndex)
      setActiveIndex((i) => (i + 1) % SLIDES.length)
      setTick((t) => t + 1)
    }, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
    // activeIndex is read directly (setPreviousIndex(activeIndex)), so it
    // must be a real dependency here -- it isn't implicitly covered just
    // because tick changes in lockstep with it.
  }, [isPaused, tick, activeIndex])

  const goTo = (index: number) => {
    setPreviousIndex(activeIndex)
    setActiveIndex((index + SLIDES.length) % SLIDES.length)
    setTick((t) => t + 1)
  }

  return (
    <section
      className="relative aspect-[16/9] max-h-[640px] min-h-[420px] w-full overflow-hidden bg-brand-navy-dark"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {SLIDES.map((slide, index) => {
        const isActive = index === activeIndex
        const isLeaving =
          !isActive && index === previousIndex && previousIndex !== activeIndex

        const motionClass = isActive
          ? "animate-hero-slide-in will-change-[opacity,transform,filter]"
          : isLeaving
          ? "animate-hero-slide-out will-change-[opacity,transform,filter]"
          : "opacity-0"

        return (
          <div
            key={slide.image}
            className={`absolute inset-0 ${isActive ? "" : "pointer-events-none"}`}
            aria-hidden={!isActive}
          >
            {/* The ONE animated element per slide. Image, dark overlay, and
                the whole text block are plain (non-animated) children
                riding this single div's opacity/transform/filter as one
                flattened, rigid unit -- there is exactly one CSS animation
                instance per slide change, so nothing here can visually
                drift out of sync with anything else.
                Keyed so it remounts -- replaying the animation from 0% --
                every time this slide freshly becomes active; while it's
                leaving or idle the key stays constant, so no remount (and
                no Next/Image churn) happens for those states. */}
            <div
              key={isActive ? `enter-${tick}` : "rest"}
              className={`absolute inset-0 ${motionClass}`}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                className="object-cover"
                style={{ objectPosition: slide.objectPosition }}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/95 via-brand-navy-dark/50 to-brand-navy-dark/10" />

              <div className="content-container relative flex h-full items-end pb-16 small:items-center small:pb-0">
                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-sky">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight text-white small:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">
                    {slide.description}
                  </p>
                  <Link
                    href={slide.ctaHref}
                    className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-brand-navy transition-transform duration-200 hover:scale-105 hover:opacity-90"
                  >
                    {slide.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => goTo(activeIndex - 1)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 small:flex"
      >
        <ChevronLeftMini />
      </button>
      <button
        type="button"
        onClick={() => goTo(activeIndex + 1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 small:flex"
      >
        <ChevronRightMini />
      </button>

      {/* Instagram-story-style progress segments: the active one fills over
          the same 5s window the auto-advance timer runs on (pausing exactly
          when the timer pauses, via animation-play-state), instead of a
          flat dot that only tells you which slide you're on. Deliberately
          left on its own independent 5s linear clock -- it communicates
          time-until-next-slide, a different signal from the slide-change
          motion above, and was never part of the "too busy" feedback. */}
      <div className="absolute bottom-6 left-1/2 z-10 flex w-48 -translate-x-1/2 gap-2 small:w-64">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            {index === activeIndex && (
              <div
                key={tick}
                className="h-full rounded-full bg-white animate-hero-progress"
                style={{ animationPlayState: isPaused ? "paused" : "running" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
