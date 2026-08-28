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

type UpdateBlogPostStepInput = {
  id: string
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  status?: "draft" | "published"
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_name?: string
  author_id?: string
  category_id?: string | null
  tag_ids?: string[]
}

const updateBlogPostStep = createStep(
  "update-blog-post",
  async (input: UpdateBlogPostStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)

    const existing = await blogModuleService.retrieveBlogPost(input.id)

    const data: Record<string, unknown> = { ...input }

    if (input.slug || input.title) {
      data.slug = slugify(input.slug || input.title!)
    }

    if (input.status === "published" && existing.status !== "published" && !existing.published_at) {
      data.published_at = new Date()
    }

    let post
    try {
      post = await blogModuleService.updateBlogPosts(data as { id: string })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A post with slug "${data.slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(post, existing)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    // Roll back only the scalar/FK fields the update step could have
    // changed — `previous` is a full retrieveBlogPost() entity, whose
    // `category` is a resolved relation object, not the FK string the
    // update DML expects.
    const {
      id, title, slug, excerpt, content, status, published_at,
      featured_image, seo_title, seo_description, author_name, author_id,
      category_id, tag_ids,
    } = previous
    await blogModuleService.updateBlogPosts({
      id, title, slug, excerpt, content, status, published_at,
      featured_image, seo_title, seo_description, author_name, author_id,
      category_id, tag_ids,
    })
  }
)

export const updateBlogPostWorkflow = createWorkflow(
  "update-blog-post",
  (input: UpdateBlogPostStepInput) => {
    const post = updateBlogPostStep(input)
    return new WorkflowResponse(post)
  }
)
