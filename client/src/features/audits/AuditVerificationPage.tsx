import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listMyPendingItems, recordAuditResult } from "./api"
import { RecordResultDialog } from "./RecordResultDialog"
import type { RecordResultFormValues } from "./schemas"
import type { PendingAuditItem } from "./types"

export function AuditVerificationPage() {
  const [items, setItems] = useState<PendingAuditItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<PendingAuditItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const refresh = () => {
    setIsLoading(true)
    listMyPendingItems()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleVerify = (item: PendingAuditItem) => {
    setActiveItem(item)
    setDialogOpen(true)
  }

  const handleSubmit = async (values: RecordResultFormValues) => {
    if (!activeItem) return
    await recordAuditResult(activeItem.auditCycleId, activeItem.id, {
      foundStatus: values.foundStatus,
      foundCondition: values.foundCondition,
      discrepancyNotes: values.discrepancyNotes || undefined,
    })
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-semibold">My audit items</h1>
        <Link to="/audits" className="text-sm text-muted-foreground underline underline-offset-4">
          Back to audit cycles
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending items — you have nothing to verify right now.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {item.asset.name} <span className="text-muted-foreground">({item.asset.assetTag})</span>
                  </CardTitle>
                  <CardDescription>
                    {item.auditCycle.name} · system of record: {item.asset.status} /{" "}
                    {item.asset.condition}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => handleVerify(item)}>
                  Verify
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <RecordResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={activeItem}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
