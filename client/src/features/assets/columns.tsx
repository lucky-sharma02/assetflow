import type { ColumnDef } from "@tanstack/react-table"
import type { Asset } from "./types"

export const assetColumns: ColumnDef<Asset>[] = [
  { accessorKey: "assetTag", header: "Tag" },
  { accessorKey: "name", header: "Name" },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => row.original.category.name,
  },
  {
    id: "department",
    header: "Department",
    cell: ({ row }) => row.original.department?.name ?? "—",
  },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "condition", header: "Condition" },
]
