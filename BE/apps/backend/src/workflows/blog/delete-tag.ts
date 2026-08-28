import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../../modules/blog"
import BlogModuleService from "../../modules/blog/service"

const deleteBlogTagStep = createStep(
  "delete-blog-tag",
  async (id: string, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogTags(id)
    return new StepResponse(id)
  }
)

export const deleteBlogTagWorkflow = createWorkflow(
  "delete-blog-tag",
  (id: string) => {
    const result = deleteBlogTagStep(id)
    return new WorkflowResponse(result)
  }
)
