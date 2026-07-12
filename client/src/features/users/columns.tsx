import type { ColumnDef } from "@tanstack/react-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Role } from "@/lib/auth"
import { ROLES, type DirectoryUser } from "./types"

interface ColumnActions {
  onPromote: (user: DirectoryUser, role: Role) => void
}

export function buildUserColumns(canPromote: boolean, actions: ColumnActions): ColumnDef<DirectoryUser>[] {
  const columns: ColumnDef<DirectoryUser>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => row.original.department?.name ?? "—",
    },
  ]

  columns.push({
    id: "role",
    header: "Role",
    cell: ({ row }) => {
      const user = row.original
      if (!canPromote) {
        return user.role
      }
      return (
        <Select value={user.role} onValueChange={(role) => actions.onPromote(user, role as Role)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  })

  return columns
}
