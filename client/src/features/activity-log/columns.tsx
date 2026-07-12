import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import type { ActivityLog } from "./types"

function formatAction(action: string) {
  const lower = action.replace(/_/g, " ").toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export const activityLogColumns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => formatAction(row.original.action),
  },
  {
    id: "entity",
    header: "Entity",
    cell: ({ row }) =>
      row.original.entityType === "Asset" ? (
        <Link to={`/assets/${row.original.entityId}`} className="underline underline-offset-4">
          Asset
        </Link>
      ) : (
        row.original.entityType
      ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => row.original.user?.name ?? "System",
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) =>
      row.original.metadata ? (
        <span className="text-xs text-muted-foreground">
          {Object.entries(row.original.metadata)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(", ")}
        </span>
      ) : (
        "—"
      ),
  },
]
