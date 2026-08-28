"use client"

import { useEffect, useRef, useState } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"

// Fades a section up into place the first time it scrolls into view.
// useIntersection toggles live (true/false as the element crosses the
// viewport both ways) — latching it into hasBeenVisible state means the
// reveal only ever plays once per section and never flickers back out when
// scrolling back up past it.
export default function RevealOnScroll({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useIntersection(ref, "-100px")
  const [hasBeenVisible, setHasBeenVisible] = useState(false)

  useEffect(() => {
    if (inView) setHasBeenVisible(true)
  }, [inView])

  return (
    <div
      ref={ref}
      className={`${className} ${hasBeenVisible ? "animate-fade-in-up" : "opacity-0"}`}
    >
      {children}
    </div>
  )
}
