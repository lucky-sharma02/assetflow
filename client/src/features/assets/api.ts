import { apiFetch } from "@/lib/api"
import type { Asset, AssetCondition, AssetDetail, AssetFilters } from "./types"

export interface RegisterAssetInput {
  name: string
  categoryId: string
  departmentId?: string
  condition?: AssetCondition
  isBookable?: boolean
  serialNumber?: string
  purchaseDate?: string
  purchaseCost?: number
  location?: string
  notes?: string
}

export async function listAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.categoryId) params.set("categoryId", filters.categoryId)
  if (filters.departmentId) params.set("departmentId", filters.departmentId)
  if (filters.status) params.set("status", filters.status)
  if (filters.condition) params.set("condition", filters.condition)
  if (filters.isBookable !== undefined) params.set("isBookable", String(filters.isBookable))

  const query = params.toString()
  const data = await apiFetch(`/api/assets${query ? `?${query}` : ""}`)
  return data.assets
}

export async function getAsset(id: string): Promise<AssetDetail> {
  const data = await apiFetch(`/api/assets/${id}`)
  return data.asset
}

export async function registerAsset(input: RegisterAssetInput): Promise<Asset> {
  const data = await apiFetch("/api/assets", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.asset
}
