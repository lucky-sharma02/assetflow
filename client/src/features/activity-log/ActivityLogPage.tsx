import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { listActivityLogs } from "./api"
import { activityLogColumns } from "./columns"
import type { ActivityLog } from "./types"

const PAGE_SIZE = 50

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setError(null)
    listActivityLogs({ limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        setLogs(data)
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }, [])

  const loadMore = () => {
    setIsLoadingMore(true)
    setError(null)
    listActivityLogs({ limit: PAGE_SIZE, offset: logs.length })
      .then((data) => {
        setLogs((prev) => [...prev, ...data])
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load more"))
      .finally(() => setIsLoadingMore(false))
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Activity log</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <DataTable
            columns={activityLogColumns}
            data={logs}
            emptyMessage="No activity recorded yet."
          />
          {hasMore && (
            <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : "Load more"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
