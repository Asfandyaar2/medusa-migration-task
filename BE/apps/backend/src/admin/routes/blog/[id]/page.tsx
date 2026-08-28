import { Container, Heading, Button, Text, toast, usePrompt } from "@medusajs/ui"
import { Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import PostForm, { PostFormValues } from "../components/post-form"
import { fetchJSON, BlogPost } from "../types"

const EditBlogPostPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", id],
    queryFn: () => fetchJSON<{ blog_post: BlogPost }>(`/admin/blog/posts/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (values: PostFormValues) =>
      fetchJSON<{ blog_post: BlogPost }>(`/admin/blog/posts/${id}`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Post saved")
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["blog-post", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetchJSON(`/admin/blog/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Post deleted")
      navigate("/blog")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDelete = async () => {
    if (!data?.blog_post) {
      return
    }
    const confirmed = await prompt({
      title: "Delete post",
      description: `Are you sure you want to delete "${data.blog_post.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Loading...</Text>
      </Container>
    )
  }

  if (!data?.blog_post) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Post not found.</Text>
      </Container>
    )
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Edit post</Heading>
        <Button
          size="small"
          variant="danger"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
        >
          <Trash />
          Delete
        </Button>
      </div>
      <PostForm
        initialValues={data.blog_post}
        onSubmit={(values) => updateMutation.mutate(values)}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save"
      />
    </Container>
  )
}

export default EditBlogPostPage
