import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { closeAuditCycle, getDiscrepancyReport } from "./api"
import type { DiscrepancyReportItem } from "./types"

export function DiscrepancyReportPage() {
  const { cycleId } = useParams<{ cycleId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canClose = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [items, setItems] = useState<DiscrepancyReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lostAssetIds, setLostAssetIds] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!cycleId) return
    setIsLoading(true)
    setError(null)
    getDiscrepancyReport(cycleId)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }, [cycleId])

  const toggleLost = (assetId: string, checked: boolean) => {
    setLostAssetIds((prev) =>
      checked ? [...prev, assetId] : prev.filter((id) => id !== assetId)
    )
  }

  const handleClose = async () => {
    if (!cycleId) return
    const confirmed = confirm(
      lostAssetIds.length > 0
        ? `Close this audit cycle and mark ${lostAssetIds.length} asset(s) as LOST? This cannot be undone.`
        : "Close this audit cycle? This cannot be undone."
    )
    if (!confirmed) return

    setError(null)
    setIsClosing(true)
    try {
      await closeAuditCycle(cycleId, lostAssetIds)
      navigate("/audits")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close cycle")
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Discrepancy report</h1>
        <Link to="/audits" className="text-sm text-muted-foreground underline underline-offset-4">
          Back to audit cycles
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No discrepancies found — every verified item matched its system record.
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border p-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0">
              <div className="text-sm">
                <p className="font-medium">
                  {item.asset.name} ({item.asset.assetTag})
                </p>
                <p className="text-muted-foreground">
                  System: {item.asset.status} / {item.asset.condition} — Found:{" "}
                  {item.foundStatus} / {item.foundCondition}
                </p>
                {item.discrepancyNotes && <p className="text-muted-foreground">"{item.discrepancyNotes}"</p>}
                {item.verifiedBy && (
                  <p className="text-muted-foreground">Verified by {item.verifiedBy.name}</p>
                )}
              </div>
              {canClose && (
                <div className="flex shrink-0 items-center gap-2">
                  <Checkbox
                    id={`lost-${item.assetId}`}
                    checked={lostAssetIds.includes(item.assetId)}
                    onCheckedChange={(checked) => toggleLost(item.assetId, checked === true)}
                  />
                  <Label htmlFor={`lost-${item.assetId}`} className="font-normal">
                    Confirmed missing
                  </Label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canClose && (
        <Button onClick={handleClose} disabled={isClosing} variant="destructive" className="w-fit">
          {isClosing ? "Closing..." : "Close audit cycle"}
        </Button>
      )}
    </div>
  )
}
