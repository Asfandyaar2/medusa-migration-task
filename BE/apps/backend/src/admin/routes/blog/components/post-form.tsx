import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Input,
  Textarea,
  Select,
  Label,
  Button,
  Badge,
  Text,
  Switch,
} from "@medusajs/ui"
import { fetchJSON, BlogCategory, BlogTag, AdminUser, BlogPost } from "../types"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export type PostFormValues = {
  title: string
  slug: string
  excerpt: string
  content: string
  status: "draft" | "published"
  featured_image: string
  seo_title: string
  seo_description: string
  author_name: string
  category_id: string
  tag_ids: string[]
}

export default function PostForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  initialValues?: Partial<BlogPost>
  onSubmit: (values: PostFormValues) => void
  isSubmitting: boolean
  submitLabel: string
}) {
  const [values, setValues] = useState<PostFormValues>({
    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    excerpt: initialValues?.excerpt ?? "",
    content: initialValues?.content ?? "",
    status: initialValues?.status ?? "draft",
    featured_image: initialValues?.featured_image ?? "",
    seo_title: initialValues?.seo_title ?? "",
    seo_description: initialValues?.seo_description ?? "",
    author_name: initialValues?.author_name ?? "",
    category_id: initialValues?.category?.id ?? "",
    tag_ids: initialValues?.tags?.map((t) => t.id) ?? [],
  })
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug)

  const { data: categoriesData } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => fetchJSON<{ blog_categories: BlogCategory[] }>("/admin/blog/categories"),
  })
  const { data: tagsData } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => fetchJSON<{ blog_tags: BlogTag[] }>("/admin/blog/tags"),
  })
  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchJSON<{ users: AdminUser[] }>("/admin/users?limit=100"),
  })

  useEffect(() => {
    if (!slugTouched) {
      setValues((v) => ({ ...v, slug: slugify(v.title) }))
    }
  }, [values.title, slugTouched])

  const toggleTag = (id: string) => {
    setValues((v) => ({
      ...v,
      tag_ids: v.tag_ids.includes(id)
        ? v.tag_ids.filter((t) => t !== id)
        : [...v.tag_ids, id],
    }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
      className="flex flex-col gap-y-6 p-6"
    >
      <div className="flex flex-col gap-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true)
            setValues((v) => ({ ...v, slug: e.target.value }))
          }}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          rows={2}
          value={values.excerpt}
          onChange={(e) => setValues((v) => ({ ...v, excerpt: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={12}
          value={values.content}
          onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))}
          required
        />
        <Text size="xsmall" className="text-ui-fg-subtle">
          Plain text. Separate paragraphs with a blank line.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-x-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={values.category_id}
            onValueChange={(value) => setValues((v) => ({ ...v, category_id: value }))}
          >
            <Select.Trigger id="category">
              <Select.Value placeholder="No category" />
            </Select.Trigger>
            <Select.Content>
              {categoriesData?.blog_categories.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="author">Author</Label>
          <Select
            value={values.author_name}
            onValueChange={(value) => setValues((v) => ({ ...v, author_name: value }))}
          >
            <Select.Trigger id="author">
              <Select.Value placeholder="No author" />
            </Select.Trigger>
            <Select.Content>
              {usersData?.users.map((u) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email
                return (
                  <Select.Item key={u.id} value={name}>
                    {name}
                  </Select.Item>
                )
              })}
            </Select.Content>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tagsData?.blog_tags.map((tag) => (
            <Badge
              key={tag.id}
              role="button"
              onClick={() => toggleTag(tag.id)}
              color={values.tag_ids.includes(tag.id) ? "blue" : "grey"}
              className="cursor-pointer select-none"
            >
              {tag.name}
            </Badge>
          ))}
          {!tagsData?.blog_tags.length && (
            <Text size="xsmall" className="text-ui-fg-subtle">
              No tags yet — create some from the Tags tab.
            </Text>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="featured_image">Featured image URL</Label>
        <Input
          id="featured_image"
          value={values.featured_image}
          onChange={(e) => setValues((v) => ({ ...v, featured_image: e.target.value }))}
          placeholder="https://..."
        />
        {values.featured_image && (
          <img
            src={values.featured_image}
            alt=""
            className="h-32 w-auto rounded-md object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="seo_title">SEO title</Label>
        <Input
          id="seo_title"
          value={values.seo_title}
          onChange={(e) => setValues((v) => ({ ...v, seo_title: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="seo_description">SEO description</Label>
        <Textarea
          id="seo_description"
          rows={2}
          value={values.seo_description}
          onChange={(e) => setValues((v) => ({ ...v, seo_description: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-x-2">
        <Switch
          id="status"
          checked={values.status === "published"}
          onCheckedChange={(checked) =>
            setValues((v) => ({ ...v, status: checked ? "published" : "draft" }))
          }
        />
        <Label htmlFor="status">
          {values.status === "published" ? "Published" : "Draft"}
        </Label>
      </div>

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
