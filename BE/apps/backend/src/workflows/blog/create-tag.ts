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

type CreateBlogTagStepInput = {
  name: string
  slug?: string
}

const createBlogTagStep = createStep(
  "create-blog-tag",
  async (input: CreateBlogTagStepInput, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    const slug = slugify(input.slug || input.name)

    let tag
    try {
      tag = await blogModuleService.createBlogTags({
        ...input,
        slug,
      })
    } catch (error) {
      if (error?.message?.includes("duplicate key") || error?.code === "23505") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `A tag with slug "${slug}" already exists`
        )
      }
      throw error
    }

    return new StepResponse(tag, tag.id)
  },
  async (tagId, { container }) => {
    if (!tagId) {
      return
    }
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogTags(tagId)
  }
)

export const createBlogTagWorkflow = createWorkflow(
  "create-blog-tag",
  (input: CreateBlogTagStepInput) => {
    const tag = createBlogTagStep(input)
    return new WorkflowResponse(tag)
  }
)
