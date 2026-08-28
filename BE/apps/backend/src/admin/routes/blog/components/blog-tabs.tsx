import { Link, useLocation } from "react-router-dom"
import { clx } from "@medusajs/ui"

const TABS = [
  { label: "Posts", to: "/blog" },
  { label: "Categories", to: "/blog/categories" },
  { label: "Tags", to: "/blog/tags" },
]

export default function BlogTabs() {
  const location = useLocation()

  return (
    <div className="flex items-center gap-x-2 border-b px-6 py-2">
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={clx(
              "txt-compact-small-plus rounded-md px-3 py-1.5",
              isActive
                ? "bg-ui-bg-base-hover text-ui-fg-base"
                : "text-ui-fg-subtle hover:text-ui-fg-base"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
