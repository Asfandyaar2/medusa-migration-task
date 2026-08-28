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

type UpdateBlogTagStepInput = {
  id: string
  name?: string
  slug?: string
}

const updateBlogTagStep = createStep(
  "update-blog-tag",
  async (input: UpdateBlogTagStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    const existing = await blogModuleService.retrieveBlogTag(input.id)

    const data: Record<string, unknown> = { ...input }
    if (input.slug || input.name) {
      data.slug = slugify(input.slug || input.name!)
    }

    let tag
    try {
      tag = await blogModuleService.updateBlogTags(data as { id: string })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A tag with slug "${data.slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(tag, existing)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.updateBlogTags(previous)
  }
)

export const updateBlogTagWorkflow = createWorkflow(
  "update-blog-tag",
  (input: UpdateBlogTagStepInput) => {
    const tag = updateBlogTagStep(input)
    return new WorkflowResponse(tag)
  }
)
