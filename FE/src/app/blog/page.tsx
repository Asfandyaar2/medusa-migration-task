import { Metadata } from "next"
import Link from "next/link"
import { listBlogPosts, listBlogCategories } from "@lib/data/blog"
import { STORE_NAME } from "@lib/constants/store"
import SiteHeader from "@modules/vape-store/components/site-header"
import SiteFooter from "@modules/vape-store/components/site-footer"
import NicotineWarningStrip from "@modules/vape-store/components/nicotine-warning-strip"
import SectionHeading from "@modules/vape-store/components/section-heading"
import { getCartItemCount } from "@modules/vape-store/components/cart-count-badge"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

type Props = {
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Blog | ${STORE_NAME}`,
    description: `Guides, product notes, and updates from ${STORE_NAME}.`,
    alternates: {
      canonical: `${BASE_URL}/blog`,
    },
  }
}

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams
  const [{ blog_posts: posts }, categories, cartItemCount] = await Promise.all([
    listBlogPosts({ categoryHandle: category }),
    listBlogCategories(),
    getCartItemCount(),
  ])

  return (
    <>
      <NicotineWarningStrip />
      <SiteHeader cartItemCount={cartItemCount} />
      <main className="content-container py-12">
        <SectionHeading eyebrow="From the Blog" title="Guides & Updates" tone="light" />

        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                !category
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-brand-navy/30 text-brand-navy hover:border-brand-navy"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/blog?category=${c.slug}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  category === c.slug
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-brand-navy/30 text-brand-navy hover:border-brand-navy"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="mt-12 text-sm text-grey-50">No posts yet — check back soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 small:grid-cols-2 medium:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-2xl bg-brand-silver shadow-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-brand-glow"
              >
                {post.featured_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-brand-sky">
                    {post.category && <span>{post.category.name}</span>}
                    <span className="text-brand-navy/40">
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 font-display text-lg font-bold text-brand-navy">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-brand-navy/70">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
