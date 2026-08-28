"use client"

import { createContext, useCallback, useContext, useState } from "react"

type CartCountContextValue = {
  count: number
  setCount: (count: number) => void
  bump: (delta: number) => void
  /**
   * True once the count has been seeded from a real server value at least
   * once this session. SiteHeader checks this before syncing its
   * server-computed prop into the count -- without it, navigating to a new
   * page (which mounts a fresh SiteHeader) would re-seed from that page's
   * own cartItemCount prop, stomping an optimistic bump whose backend
   * request just hadn't finished (and its revalidated data reflected) yet.
   */
  initialized: boolean
  markInitialized: () => void
}

const CartCountContext = createContext<CartCountContextValue | null>(null)

// One shared count for the whole tab, so a change made on the product page
// (add) or the cart page (remove/quantity) reflects in SiteHeader
// immediately, wherever it's rendered -- without waiting for the
// server-computed count that only arrives once router.refresh() resolves.
export function CartCountProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState(0)
  const [initialized, setInitialized] = useState(false)

  const bump = useCallback((delta: number) => {
    setCount((current) => Math.max(0, current + delta))
  }, [])

  const markInitialized = useCallback(() => setInitialized(true), [])

  return (
    <CartCountContext.Provider
      value={{ count, setCount, bump, initialized, markInitialized }}
    >
      {children}
    </CartCountContext.Provider>
  )
}

export function useCartCount() {
  const context = useContext(CartCountContext)
  if (!context) {
    throw new Error("useCartCount must be used within a CartCountProvider")
  }
  return context
}
