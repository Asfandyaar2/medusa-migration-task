import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "../../modules/blog"
import BlogModuleService from "../../modules/blog/service"
import { slugify } from "../../modules/blog/utils/slugify"

type CreateBlogPostStepInput = {
  title: string
  slug?: string
  excerpt?: string
  content: string
  status?: "draft" | "published"
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_name?: string
  author_id?: string
  category_id?: string
  tag_ids?: string[]
}

const createBlogPostStep = createStep(
  "create-blog-post",
  async (input: CreateBlogPostStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)

    const slug = slugify(input.slug || input.title)
    const status = input.status || "draft"

    const { slug: _slug, ...rest } = input

    let post
    try {
      post = await blogModuleService.createBlogPosts({
        ...rest,
        slug,
        status,
        published_at: status === "published" ? new Date() : null,
      })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A post with slug "${slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(post, post.id)
  },
  async (postId, { container }) => {
    if (!postId) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogPosts(postId)
  }
)

export const createBlogPostWorkflow = createWorkflow(
  "create-blog-post",
  (input: CreateBlogPostStepInput) => {
    const post = createBlogPostStep(input)
    return new WorkflowResponse(post)
  }
)
