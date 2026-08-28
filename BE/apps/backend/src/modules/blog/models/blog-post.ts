import { model } from "@medusajs/framework/utils"
import BlogCategory from "./blog-category"

const BlogPost = model.define("blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique().index(),
  excerpt: model.text().nullable(),
  content: model.text(),
  status: model.enum(["draft", "published"]).default("draft").index(),
  published_at: model.dateTime().nullable(),
  featured_image: model.text().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  // Denormalized display name, not a formal link to the core User module —
  // Users aren't public/customer-scoped, so a storefront-facing author name
  // has to live on the post regardless of what backs the admin picker.
  author_name: model.text().nullable(),
  // The actor who actually performed the write, stamped server-side from
  // req.auth_context.actor_id — independent of author_name, which the admin
  // may set to credit someone else.
  author_id: model.text().nullable(),
  category: model.belongsTo(() => BlogCategory, {
    mappedBy: "posts",
  }).nullable(),
  // A plain JSON array of BlogTag ids rather than a formal many-to-many
  // relation — tags are resolved by id in the API routes. Sidesteps ORM
  // relation-write semantics (which treat manyToMany writes as "create new
  // child rows", not "link existing independent rows") for what is really
  // just a lightweight, order-independent set of references.
  tag_ids: model.json().nullable(),
})

export default BlogPost
