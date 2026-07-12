import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { useAuth, type Role } from "@/lib/auth"
import { listUsers, promoteRole } from "./api"
import { buildUserColumns } from "./columns"
import type { DirectoryUser } from "./types"

export function EmployeeDirectoryPage() {
  const { user: currentUser } = useAuth()
  const canPromote = currentUser?.role === "ADMIN"

  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setIsLoading(true)
    setError(null)
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handlePromote = async (target: DirectoryUser, role: Role) => {
    const previous = users
    setUsers((current) => current.map((u) => (u.id === target.id ? { ...u, role } : u)))
    try {
      await promoteRole(target.id, role)
    } catch (err) {
      setUsers(previous)
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const columns = buildUserColumns(canPromote, { onPromote: handlePromote })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Employee directory</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={columns} data={users} emptyMessage="No users found." />
      )}
    </div>
  )
}
