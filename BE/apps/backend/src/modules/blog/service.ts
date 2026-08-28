import { MedusaService } from "@medusajs/framework/utils"
import BlogPost from "./models/blog-post"
import BlogCategory from "./models/blog-category"
import BlogTag from "./models/blog-tag"

class BlogModuleService extends MedusaService({
  BlogPost,
  BlogCategory,
  BlogTag,
}) {}

export default BlogModuleService
