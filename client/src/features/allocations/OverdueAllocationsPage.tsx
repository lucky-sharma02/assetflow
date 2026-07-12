import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { listOverdueAllocations } from "./api"
import { overdueAllocationColumns } from "./columns"
import type { Allocation } from "./types"

export function OverdueAllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    listOverdueAllocations()
      .then(setAllocations)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Overdue allocations</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={overdueAllocationColumns}
          data={allocations}
          emptyMessage="No overdue allocations — everything is on track."
        />
      )}
    </div>
  )
}
