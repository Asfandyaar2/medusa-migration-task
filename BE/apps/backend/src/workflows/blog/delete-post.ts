import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../../modules/blog"
import BlogModuleService from "../../modules/blog/service"

const deleteBlogPostStep = createStep(
  "delete-blog-post",
  async (id: string, { container }) => {
    const blogModuleService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogModuleService.deleteBlogPosts(id)
    return new StepResponse(id)
  }
)

export const deleteBlogPostWorkflow = createWorkflow(
  "delete-blog-post",
  (id: string) => {
    const result = deleteBlogPostStep(id)
    return new WorkflowResponse(result)
  }
)
