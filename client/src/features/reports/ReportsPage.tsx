import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { downloadFile } from "@/lib/api"
import { AssetUtilizationChart } from "./AssetUtilizationChart"
import {
  getAssetUtilizationReport,
  getDepartmentAllocationReport,
  getMaintenanceFrequencyReport,
} from "./api"
import { DepartmentAllocationChart } from "./DepartmentAllocationChart"
import { MaintenanceFrequencyChart } from "./MaintenanceFrequencyChart"
import type {
  AssetUtilizationReport,
  DepartmentAllocationItem,
  MaintenanceFrequencyItem,
} from "./types"

export function ReportsPage() {
  const [utilization, setUtilization] = useState<AssetUtilizationReport | null>(null)
  const [frequency, setFrequency] = useState<MaintenanceFrequencyItem[]>([])
  const [departments, setDepartments] = useState<DepartmentAllocationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAssetUtilizationReport(),
      getMaintenanceFrequencyReport(),
      getDepartmentAllocationReport(),
    ])
      .then(([u, f, d]) => {
        setUtilization(u)
        setFrequency(f)
        setDepartments(d)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }, [])

  const handleExportDepartmentAllocation = async () => {
    setError(null)
    try {
      await downloadFile(
        "/api/reports/department-allocation/export",
        "department-allocation.csv"
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export")
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports & analytics</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Asset utilization</CardTitle>
              <CardDescription>
                Share of the {utilization?.total ?? 0} registered assets in each operational
                status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {utilization && <AssetUtilizationChart data={utilization.byStatus} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance frequency</CardTitle>
              <CardDescription>
                The assets with the most maintenance requests raised against them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {frequency.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maintenance requests yet.</p>
              ) : (
                <MaintenanceFrequencyChart data={frequency} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Department-wise allocation</CardTitle>
                <CardDescription>
                  Percentage of each department's assets that are currently allocated.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportDepartmentAllocation}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments yet.</p>
              ) : (
                <DepartmentAllocationChart data={departments} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
