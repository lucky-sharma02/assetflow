import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import type { Category } from "./types"

interface ColumnActions {
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function buildCategoryColumns(
  isAdmin: boolean,
  actions: ColumnActions
): ColumnDef<Category>[] {
  const columns: ColumnDef<Category>[] = [
    { accessorKey: "name", header: "Name" },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      id: "extraFields",
      header: "Extra fields",
      cell: ({ row }) => {
        const extraFields = row.original.extraFields
        if (!extraFields || Object.keys(extraFields).length === 0) return "—"
        return Object.entries(extraFields)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      },
    },
  ]

  if (isAdmin) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => actions.onEdit(row.original)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => actions.onDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    })
  }

  return columns
}
