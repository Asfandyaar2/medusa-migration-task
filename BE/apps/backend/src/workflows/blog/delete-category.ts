import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../../modules/blog"
import BlogModuleService from "../../modules/blog/service"

const deleteBlogCategoryStep = createStep(
  "delete-blog-category",
  async (id: string, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogCategories(id)
    return new StepResponse(id)
  }
)

export const deleteBlogCategoryWorkflow = createWorkflow(
  "delete-blog-category",
  (id: string) => {
    const result = deleteBlogCategoryStep(id)
    return new WorkflowResponse(result)
  }
)
