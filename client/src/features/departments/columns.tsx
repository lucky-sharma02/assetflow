import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import type { Department } from "./types"

interface ColumnActions {
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
}

export function buildDepartmentColumns(
  isAdmin: boolean,
  actions: ColumnActions
): ColumnDef<Department>[] {
  const columns: ColumnDef<Department>[] = [
    { accessorKey: "name", header: "Name" },
    {
      id: "head",
      header: "Head",
      cell: ({ row }) => row.original.head?.name ?? "—",
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => row.original._count.members,
    },
    {
      id: "assets",
      header: "Assets",
      cell: ({ row }) => row.original._count.assets,
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
