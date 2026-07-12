import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AssetStatusChart } from "./AssetStatusChart"
import { getDashboardSummary } from "./api"
import type { DashboardSummary } from "./types"

function StatTile({
  label,
  value,
  emphasize,
}: {
  label: string
  value: number
  emphasize?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-semibold ${emphasize && value > 0 ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading || !summary ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatTile label="Total assets" value={summary.assets.total} />
            <StatTile label="Active allocations" value={summary.allocations.active} />
            <StatTile
              label="Overdue allocations"
              value={summary.allocations.overdue}
              emphasize
            />
            <StatTile label="Pending transfers" value={summary.transfers.pending} />
            <StatTile label="Pending maintenance" value={summary.maintenance.pending} />
            <StatTile label="Upcoming bookings" value={summary.bookings.upcoming} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assets by status</CardTitle>
              <CardDescription>
                {summary.assets.byStatus
                  .map((s) => `${s.status.replace("_", " ").toLowerCase()}: ${s.count}`)
                  .join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetStatusChart data={summary.assets.byStatus} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
