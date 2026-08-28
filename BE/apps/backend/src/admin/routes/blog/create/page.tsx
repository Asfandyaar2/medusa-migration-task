import { Container, Heading, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import PostForm, { PostFormValues } from "../components/post-form"
import { fetchJSON, BlogPost } from "../types"

const CreateBlogPostPage = () => {
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: (values: PostFormValues) =>
      fetchJSON<{ blog_post: BlogPost }>("/admin/blog/posts", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Post created")
      navigate("/blog")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Create post</Heading>
      </div>
      <PostForm
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
        submitLabel="Create post"
      />
    </Container>
  )
}

export default CreateBlogPostPage
