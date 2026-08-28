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

type UpdateBlogCategoryStepInput = {
  id: string
  name?: string
  slug?: string
  description?: string
}

const updateBlogCategoryStep = createStep(
  "update-blog-category",
  async (input: UpdateBlogCategoryStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    const existing = await blogModuleService.retrieveBlogCategory(input.id)

    const data: Record<string, unknown> = { ...input }
    if (input.slug || input.name) {
      data.slug = slugify(input.slug || input.name!)
    }

    let category
    try {
      category = await blogModuleService.updateBlogCategories(data as { id: string })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A category with slug "${data.slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(category, existing)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    // Roll back only the scalar fields the update step could have changed —
    // `previous` is a full retrieveBlogCategory() entity, whose `posts` is a
    // resolved relation array, not the FK string[] the update DML expects.
    const { id, name, slug, description } = previous
    await blogModuleService.updateBlogCategories({ id, name, slug, description })
  }
)

export const updateBlogCategoryWorkflow = createWorkflow(
  "update-blog-category",
  (input: UpdateBlogCategoryStepInput) => {
    const category = updateBlogCategoryStep(input)
    return new WorkflowResponse(category)
  }
)
