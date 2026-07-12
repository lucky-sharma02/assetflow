import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { createCategory, deleteCategory, listCategories, updateCategory } from "./api"
import { buildCategoryColumns } from "./columns"
import { CategoryFormDialog } from "./CategoryFormDialog"
import type { CategoryFormValues } from "./schemas"
import type { Category } from "./types"

export function CategoriesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const refresh = () => {
    setIsLoading(true)
    setLoadError(null)
    listCategories()
      .then(setCategories)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleCreate = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return
    await deleteCategory(category.id)
    refresh()
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    const extraFields = Object.fromEntries(
      values.extraFields.map(({ key, value }) => [key, value])
    )
    const input = {
      name: values.name,
      description: values.description || undefined,
      extraFields:
        Object.keys(extraFields).length > 0 ? extraFields : editingCategory ? null : undefined,
    }
    if (editingCategory) {
      await updateCategory(editingCategory.id, input)
    } else {
      await createCategory(input)
    }
    refresh()
  }

  const columns = buildCategoryColumns(isAdmin, { onEdit: handleEdit, onDelete: handleDelete })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Asset categories</h1>
          <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Back home
          </Link>
        </div>
        {isAdmin && <Button onClick={handleCreate}>New category</Button>}
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={columns} data={categories} emptyMessage="No categories yet." />
      )}

      {isAdmin && (
        <CategoryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
