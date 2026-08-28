export type BlogCategory = {
  id: string
  name: string
  slug: string
  description?: string | null
}

export type BlogTag = {
  id: string
  name: string
  slug: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  status: "draft" | "published"
  published_at?: string | null
  featured_image?: string | null
  seo_title?: string | null
  seo_description?: string | null
  author_name?: string | null
  author_id?: string | null
  category?: BlogCategory | null
  tags?: BlogTag[]
  created_at: string
  updated_at: string
}

export type AdminUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email: string
}

export async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request to ${url} failed with ${res.status}`)
  }

  return res.json()
}
