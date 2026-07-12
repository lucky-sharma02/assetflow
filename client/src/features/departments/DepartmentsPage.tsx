import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "./api"
import { buildDepartmentColumns } from "./columns"
import { DepartmentFormDialog } from "./DepartmentFormDialog"
import type { DepartmentFormValues } from "./schemas"
import type { Department } from "./types"

export function DepartmentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const refresh = () => {
    setIsLoading(true)
    setLoadError(null)
    listDepartments()
      .then(setDepartments)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleCreate = () => {
    setEditingDepartment(null)
    setDialogOpen(true)
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setDialogOpen(true)
  }

  const handleDelete = async (department: Department) => {
    if (!confirm(`Delete department "${department.name}"?`)) return
    await deleteDepartment(department.id)
    refresh()
  }

  const handleSubmit = async (values: DepartmentFormValues) => {
    if (editingDepartment) {
      await updateDepartment(editingDepartment.id, values.name, values.headId)
    } else {
      await createDepartment(values.name, values.headId)
    }
    refresh()
  }

  const columns = buildDepartmentColumns(isAdmin, { onEdit: handleEdit, onDelete: handleDelete })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Back home
          </Link>
        </div>
        {isAdmin && <Button onClick={handleCreate}>New department</Button>}
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={columns} data={departments} emptyMessage="No departments yet." />
      )}

      {isAdmin && (
        <DepartmentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          department={editingDepartment}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
