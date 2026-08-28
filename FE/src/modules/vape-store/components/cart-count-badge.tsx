import { retrieveCart } from "@lib/data/cart"

// Server-side helper each flat page calls to get the count to pass into
// SiteHeader — SiteHeader itself must stay a client component (it owns the
// mobile-drawer state), so it can't fetch the cart itself.
export async function getCartItemCount(): Promise<number> {
  const cart = await retrieveCart()
  if (!cart) return 0
  return (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
}
