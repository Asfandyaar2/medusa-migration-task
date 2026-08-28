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

type CreateBlogCategoryStepInput = {
  name: string
  slug?: string
  description?: string
}

const createBlogCategoryStep = createStep(
  "create-blog-category",
  async (input: CreateBlogCategoryStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    const slug = slugify(input.slug || input.name)

    let category
    try {
      category = await blogModuleService.createBlogCategories({
        ...input,
        slug,
      })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A category with slug "${slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(category, category.id)
  },
  async (categoryId, { container }) => {
    if (!categoryId) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogCategories(categoryId)
  }
)

export const createBlogCategoryWorkflow = createWorkflow(
  "create-blog-category",
  (input: CreateBlogCategoryStepInput) => {
    const category = createBlogCategoryStep(input)
    return new WorkflowResponse(category)
  }
)
