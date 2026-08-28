import { useState } from "react"
import { Container, Heading, Table, Input, Button, IconButton, Text, toast, usePrompt } from "@medusajs/ui"
import { Trash, Plus, Check } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import BlogTabs from "../components/blog-tabs"
import { fetchJSON, BlogCategory } from "../types"

const BlogCategoriesPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [edits, setEdits] = useState<Record<string, { name: string; description: string }>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => fetchJSON<{ blog_categories: BlogCategory[] }>("/admin/blog/categories"),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["blog-categories"] })

  const createMutation = useMutation({
    mutationFn: () =>
      fetchJSON("/admin/blog/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName, description: newDescription || undefined }),
      }),
    onSuccess: () => {
      toast.success("Category created")
      setNewName("")
      setNewDescription("")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description: string }) =>
      fetchJSON(`/admin/blog/categories/${id}`, {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      }),
    onSuccess: () => {
      toast.success("Category saved")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJSON(`/admin/blog/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Category deleted")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDelete = async (category: BlogCategory) => {
    const confirmed = await prompt({
      title: "Delete category",
      description: `Delete "${category.name}"? Posts in this category will become uncategorized.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) {
      deleteMutation.mutate(category.id)
    }
  }

  const editValue = (category: BlogCategory) =>
    edits[category.id] ?? { name: category.name, description: category.description ?? "" }

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
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell>Slug</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {!isLoading &&
            data?.blog_categories.map((category) => {
              const value = editValue(category)
              return (
                <Table.Row key={category.id}>
                  <Table.Cell>
                    <Input
                      value={value.name}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [category.id]: { ...value, name: e.target.value },
                        }))
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      value={value.description}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [category.id]: { ...value, description: e.target.value },
                        }))
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">{category.slug}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-x-2">
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() =>
                          updateMutation.mutate({ id: category.id, ...value })
                        }
                      >
                        <Check />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => handleDelete(category)}
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
                placeholder="New category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Table.Cell>
            <Table.Cell>
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
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

export default BlogCategoriesPage
