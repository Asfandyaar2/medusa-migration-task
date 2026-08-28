import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText, PencilSquare, Trash, Plus } from "@medusajs/icons"
import {
  Container,
  Heading,
  Table,
  Badge,
  Button,
  IconButton,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import BlogTabs from "./components/blog-tabs"
import { fetchJSON, BlogPost } from "./types"

const BlogPostsPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetchJSON<{ blog_posts: BlogPost[] }>("/admin/blog/posts?limit=100"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON(`/admin/blog/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Post deleted")
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDelete = async (post: BlogPost) => {
    const confirmed = await prompt({
      title: "Delete post",
      description: `Are you sure you want to delete "${post.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) {
      deleteMutation.mutate(post.id)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Blog</Heading>
        <Link to="/blog/create">
          <Button size="small" variant="secondary">
            <Plus />
            Create post
          </Button>
        </Link>
      </div>

      <BlogTabs />

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell>Published</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text className="text-ui-fg-subtle">Loading...</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {!isLoading && !data?.blog_posts.length && (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text className="text-ui-fg-subtle">No posts yet.</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {data?.blog_posts.map((post) => (
            <Table.Row key={post.id} className="[&_td]:last:pr-6">
              <Table.Cell>
                <Link to={`/blog/${post.id}`} className="hover:text-ui-fg-base">
                  {post.title}
                </Link>
              </Table.Cell>
              <Table.Cell>
                <Badge color={post.status === "published" ? "green" : "grey"}>
                  {post.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>{post.category?.name ?? "—"}</Table.Cell>
              <Table.Cell>
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString()
                  : "—"}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-x-2">
                  <Link to={`/blog/${post.id}`}>
                    <IconButton size="small" variant="transparent">
                      <PencilSquare />
                    </IconButton>
                  </Link>
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => handleDelete(post)}
                  >
                    <Trash />
                  </IconButton>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: DocumentText,
})

export default BlogPostsPage
