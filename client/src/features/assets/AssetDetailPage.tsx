import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AllocateDialog } from "@/features/allocations/AllocateDialog"
import { allocateAsset } from "@/features/allocations/api"
import { useAuth } from "@/lib/auth"
import { getAsset } from "./api"
import type { AssetDetail } from "./types"

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        {title} ({count})
      </h2>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">{children}</ul>
      )}
    </div>
  )
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canAllocate = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const refresh = () => {
    if (!id) return
    setIsLoading(true)
    getAsset(id)
      .then(setAsset)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [id])

  const handleAllocate = async (holderId: string, dueDate?: string) => {
    if (!id) return
    await allocateAsset({ assetId: id, holderId, dueDate })
    refresh()
  }

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading...</div>
  }

  if (error || !asset) {
    return <div className="p-8 text-sm text-destructive">{error ?? "Asset not found"}</div>
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <Link to="/assets" className="text-sm text-muted-foreground underline underline-offset-4">
        Back to assets
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>
              {asset.name} <span className="text-muted-foreground">({asset.assetTag})</span>
            </CardTitle>
            <CardDescription>
              {asset.category.name} · {asset.department?.name ?? "Unassigned"} · {asset.status} ·{" "}
              {asset.condition}
            </CardDescription>
          </div>
          {canAllocate && asset.status === "AVAILABLE" && (
            <Button onClick={() => setDialogOpen(true)}>Allocate</Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {asset.serialNumber && <p>Serial number: {asset.serialNumber}</p>}
          {asset.location && <p>Location: {asset.location}</p>}
          {asset.purchaseDate && <p>Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}</p>}
          {asset.purchaseCost && <p>Purchase cost: {asset.purchaseCost}</p>}
          {asset.notes && <p>Notes: {asset.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            Allocations, transfers, bookings, maintenance, and audit records for this asset.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Section title="Allocations" count={asset.allocations.length}>
            {asset.allocations.map((a) => (
              <li key={a.id}>
                {a.status} — {a.holder.name}, allocated {new Date(a.allocatedAt).toLocaleDateString()}
              </li>
            ))}
          </Section>
          <Section title="Transfer requests" count={asset.transferRequests.length}>
            {asset.transferRequests.map((t) => (
              <li key={t.id}>
                {t.status} — to {t.toUser.name}, requested{" "}
                {new Date(t.requestedAt).toLocaleDateString()}
              </li>
            ))}
          </Section>
          <Section title="Bookings" count={asset.bookings.length}>
            {asset.bookings.map((b) => (
              <li key={b.id}>
                {b.status} — {b.bookedBy.name}, {new Date(b.startTime).toLocaleString()}
              </li>
            ))}
          </Section>
          <Section title="Maintenance requests" count={asset.maintenanceRequests.length}>
            {asset.maintenanceRequests.map((m) => (
              <li key={m.id}>
                {m.status} — {m.issueDescription}
              </li>
            ))}
          </Section>
          <Section title="Audit records" count={asset.auditRecords.length}>
            {asset.auditRecords.map((r) => (
              <li key={r.id}>
                {r.auditCycle.name} — {r.foundStatus}/{r.foundCondition}
                {r.isDiscrepant ? " (discrepant)" : ""}
              </li>
            ))}
          </Section>
        </CardContent>
      </Card>

      {canAllocate && (
        <AllocateDialog open={dialogOpen} onOpenChange={setDialogOpen} onAllocate={handleAllocate} />
      )}
    </div>
  )
}
