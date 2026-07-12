import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import type { Allocation } from "./types"

export const overdueAllocationColumns: ColumnDef<Allocation>[] = [
  {
    id: "asset",
    header: "Asset",
    cell: ({ row }) => (
      <Link
        to={`/assets/${row.original.asset.id}`}
        className="underline underline-offset-4"
      >
        {row.original.asset.name} ({row.original.asset.assetTag})
      </Link>
    ),
  },
  {
    id: "holder",
    header: "Holder",
    cell: ({ row }) => `${row.original.holder.name} (${row.original.holder.email})`,
  },
  {
    id: "dueDate",
    header: "Due date",
    cell: ({ row }) =>
      row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : "—",
  },
  {
    id: "daysOverdue",
    header: "Days overdue",
    cell: ({ row }) => {
      if (!row.original.dueDate) return "—"
      const days = Math.floor(
        (Date.now() - new Date(row.original.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      return days
    },
  },
]
