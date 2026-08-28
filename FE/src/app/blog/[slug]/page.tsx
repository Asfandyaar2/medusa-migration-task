import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getBlogPostBySlug } from "@lib/data/blog"
import { STORE_NAME } from "@lib/constants/store"
import SiteHeader from "@modules/vape-store/components/site-header"
import SiteFooter from "@modules/vape-store/components/site-footer"
import NicotineWarningStrip from "@modules/vape-store/components/nicotine-warning-strip"
import { getCartItemCount } from "@modules/vape-store/components/cart-count-badge"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {}
  }

  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`
  const title = post.seo_title || `${post.title} | ${STORE_NAME}`
  const description =
    post.seo_description || post.excerpt || post.content.slice(0, 155)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: post.featured_image ? [post.featured_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, cartItemCount] = await Promise.all([
    getBlogPostBySlug(slug),
    getCartItemCount(),
  ])

  if (!post) {
    notFound()
  }

  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean)

  return (
    <>
      <NicotineWarningStrip />
      <SiteHeader cartItemCount={cartItemCount} />
      <main className="content-container max-w-3xl py-12">
        <Link
          href="/blog"
          className="text-xs font-semibold uppercase tracking-wide text-brand-sky hover:text-brand-navy"
        >
          ← Back to Blog
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-brand-sky">
          {post.category && <span>{post.category.name}</span>}
          <span className="text-brand-navy/40">
            {new Date(post.published_at).toLocaleDateString()}
          </span>
          {post.author_name && (
            <span className="text-brand-navy/40">by {post.author_name}</span>
          )}
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-brand-navy small:text-4xl">
          {post.title}
        </h1>

        {post.featured_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featured_image}
            alt={post.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          />
        )}

        <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-brand-navy/80">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-brand-navy/10 pt-6">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-brand-silver px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-navy/70"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
