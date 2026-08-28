import { useState } from "react"
import { Container, Heading, Table, Input, Button, IconButton, Text, toast, usePrompt } from "@medusajs/ui"
import { Trash, Plus, Check } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import BlogTabs from "../components/blog-tabs"
import { fetchJSON, BlogTag } from "../types"

const BlogTagsPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const [newName, setNewName] = useState("")
  const [edits, setEdits] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => fetchJSON<{ blog_tags: BlogTag[] }>("/admin/blog/tags"),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["blog-tags"] })

  const createMutation = useMutation({
    mutationFn: () =>
      fetchJSON("/admin/blog/tags", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      }),
    onSuccess: () => {
      toast.success("Tag created")
      setNewName("")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetchJSON(`/admin/blog/tags/${id}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Tag saved")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON(`/admin/blog/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Tag deleted")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDelete = async (tag: BlogTag) => {
    const confirmed = await prompt({
      title: "Delete tag",
      description: `Delete "${tag.name}"? It will be removed from any posts using it.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) {
      deleteMutation.mutate(tag.id)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Blog</Heading>
      </div>
      <BlogTabs />

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Slug</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {!isLoading &&
            data?.blog_tags.map((tag) => {
              const value = edits[tag.id] ?? tag.name
              return (
                <Table.Row key={tag.id}>
                  <Table.Cell>
                    <Input
                      value={value}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [tag.id]: e.target.value }))
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">{tag.slug}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-x-2">
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => updateMutation.mutate({ id: tag.id, name: value })}
                      >
                        <Check />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => handleDelete(tag)}
                      >
                        <Trash />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          <Table.Row>
            <Table.Cell>
              <Input
                placeholder="New tag name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Table.Cell>
            <Table.Cell />
            <Table.Cell>
              <div className="flex justify-end">
                <Button
                  size="small"
                  variant="secondary"
                  disabled={!newName.trim()}
                  isLoading={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  <Plus />
                  Add
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Container>
  )
}

export default BlogTagsPage
