import { notFound } from "next/navigation"

// No listing-all-products page was built for this task — only
// /products/[handle]. Without this file, /products (no handle) would fall
// through to the sibling [countryCode] dynamic segment and render a blank
// 200 page instead of a real 404.
export default function ProductsIndexPage() {
  notFound()
}
