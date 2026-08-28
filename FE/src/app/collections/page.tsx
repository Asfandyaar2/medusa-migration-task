import { notFound } from "next/navigation"

// No listing-all-collections page was built for this task — only
// /collections/[handle]. Without this file, /collections (no handle) would
// fall through to the sibling [countryCode] dynamic segment and render a
// blank 200 page instead of a real 404.
export default function CollectionsIndexPage() {
  notFound()
}
