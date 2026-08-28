import { model } from "@medusajs/framework/utils"

const BlogTag = model.define("blog_tag", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
})

export default BlogTag
