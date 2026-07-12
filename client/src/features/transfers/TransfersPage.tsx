import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { approveTransfer, listTransfers, rejectTransfer } from "./api"
import type { Transfer } from "./types"

export function TransfersPage() {
  const { user } = useAuth()
  const canDecide = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setIsLoading(true)
    setError(null)
    listTransfers()
      .then(setTransfers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleApprove = async (id: string) => {
    await approveTransfer(id)
    refresh()
  }

  const handleReject = async (id: string) => {
    await rejectTransfer(id)
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Transfer requests</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transfer requests yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {transfers.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {t.asset.name} ({t.asset.assetTag})
                </CardTitle>
                <CardDescription>
                  {t.fromUser?.name ?? "Unassigned"} → {t.toUser.name} · {t.status}
                  {t.reason ? ` · "${t.reason}"` : ""}
                </CardDescription>
              </CardHeader>
              {canDecide && t.status === "REQUESTED" && (
                <CardContent className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(t.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(t.id)}>
                    Reject
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
