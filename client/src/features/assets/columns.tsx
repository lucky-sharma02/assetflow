import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import type { Asset } from "./types"

export const assetColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "assetTag",
    header: "Tag",
    cell: ({ row }) => (
      <Link
        to={`/assets/${row.original.id}`}
        className="underline underline-offset-4"
      >
        {row.original.assetTag}
      </Link>
    ),
  },
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
