import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listCategories } from "@/features/categories/api"
import type { Category } from "@/features/categories/types"
import { downloadFile } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { listAssets, registerAsset } from "./api"
import { AssetFormDialog } from "./AssetFormDialog"
import { assetColumns } from "./columns"
import type { RegisterAssetFormValues } from "./schemas"
import { ASSET_CONDITIONS, ASSET_STATUSES, type Asset, type AssetFilters } from "./types"

const ALL_CATEGORIES = "__all_categories__"
const ALL_STATUSES = "__all_statuses__"
const ALL_CONDITIONS = "__all_conditions__"

export function AssetsPage() {
  const { user } = useAuth()
  const canRegister = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER"

  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [searchInput, setSearchInput] = useState("")
  const [filters, setFilters] = useState<AssetFilters>({})

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }))
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const refresh = () => {
    setIsLoading(true)
    listAssets(filters)
      .then(setAssets)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false))
  }

  useEffect(refresh, [filters])

  const handleSubmit = async (values: RegisterAssetFormValues) => {
    await registerAsset({
      name: values.name,
      categoryId: values.categoryId,
      departmentId: values.departmentId ?? undefined,
      condition: values.condition,
      isBookable: values.isBookable,
      serialNumber: values.serialNumber || undefined,
      location: values.location || undefined,
      notes: values.notes || undefined,
    })
    refresh()
  }

  const handleExport = async () => {
    setError(null)
    try {
      await downloadFile("/api/assets/export", "assets-export.csv")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export")
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          {canRegister && <Button onClick={() => setDialogOpen(true)}>Register asset</Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name, tag, or serial number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filters.categoryId ?? ALL_CATEGORIES}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              categoryId: value === ALL_CATEGORIES ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? ALL_STATUSES}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: value === ALL_STATUSES ? undefined : (value as AssetFilters["status"]),
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {ASSET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.condition ?? ALL_CONDITIONS}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              condition: value === ALL_CONDITIONS ? undefined : (value as AssetFilters["condition"]),
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CONDITIONS}>All conditions</SelectItem>
            {ASSET_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable columns={assetColumns} data={assets} emptyMessage="No assets match your filters." />
      )}

      {canRegister && (
        <AssetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} />
      )}
    </div>
  )
}
