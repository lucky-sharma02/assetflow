import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { listAssets, registerAsset } from "./api"
import { AssetFormDialog } from "./AssetFormDialog"
import { assetColumns } from "./columns"
import type { RegisterAssetFormValues } from "./schemas"
import type { Asset } from "./types"

export function AssetsPage() {
  const { user } = useAuth()
  const canRegister = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const refresh = () => {
    setIsLoading(true)
    listAssets()
      .then(setAssets)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [])

  const handleSubmit = async (values: RegisterAssetFormValues) => {
    await registerAsset({
      name: values.name,
      categoryId: values.categoryId,
      departmentId: values.departmentId ?? undefined,
      condition: values.condition,
      serialNumber: values.serialNumber || undefined,
      location: values.location || undefined,
      notes: values.notes || undefined,
    })
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assets</h1>
          <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Back home
          </Link>
        </div>
        {canRegister && <Button onClick={() => setDialogOpen(true)}>Register asset</Button>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={assetColumns} data={assets} emptyMessage="No assets registered yet." />
      )}

      {canRegister && (
        <AssetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} />
      )}
    </div>
  )
}
