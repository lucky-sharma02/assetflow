import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { createAuditCycle, listAuditCycles } from "./api"
import { CreateAuditCycleDialog } from "./CreateAuditCycleDialog"
import type { CreateAuditCycleFormValues } from "./schemas"
import type { AuditCycle } from "./types"

const columns = [
  { accessorKey: "name", header: "Name" },
  {
    id: "scope",
    header: "Scope",
    cell: ({ row }: { row: { original: AuditCycle } }) =>
      row.original.department?.name ?? "All departments",
  },
  { accessorKey: "status", header: "Status" },
  {
    id: "dateRange",
    header: "Date range",
    cell: ({ row }: { row: { original: AuditCycle } }) =>
      `${new Date(row.original.startDate).toLocaleDateString()} – ${new Date(
        row.original.endDate
      ).toLocaleDateString()}`,
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }: { row: { original: AuditCycle } }) => row.original._count.records,
  },
  {
    id: "auditors",
    header: "Auditors",
    cell: ({ row }: { row: { original: AuditCycle } }) => row.original._count.assignments,
  },
  {
    id: "discrepancyReport",
    header: "",
    cell: ({ row }: { row: { original: AuditCycle } }) => (
      <Link
        to={`/audits/${row.original.id}/discrepancy-report`}
        className="text-sm underline underline-offset-4"
      >
        {row.original.status === "CLOSED" ? "View report" : "Review / close"}
      </Link>
    ),
  },
]

export function AuditCyclesPage() {
  const { user } = useAuth()
  const canCreate = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [cycles, setCycles] = useState<AuditCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const refresh = () => {
    setIsLoading(true)
    setError(null)
    listAuditCycles()
      .then(setCycles)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleSubmit = async (values: CreateAuditCycleFormValues) => {
    await createAuditCycle({
      name: values.name,
      departmentId: values.departmentId ?? undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate,
      auditorIds: values.auditorIds,
    })
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit cycles</h1>
          <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Back home
          </Link>
        </div>
        {canCreate && <Button onClick={() => setDialogOpen(true)}>New audit cycle</Button>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={columns} data={cycles} emptyMessage="No audit cycles yet." />
      )}

      {canCreate && (
        <CreateAuditCycleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
