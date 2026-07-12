import { apiFetch } from "@/lib/api"
import type { Asset, AssetCondition } from "./types"

export interface RegisterAssetInput {
  name: string
  categoryId: string
  departmentId?: string
  condition?: AssetCondition
  serialNumber?: string
  purchaseDate?: string
  purchaseCost?: number
  location?: string
  notes?: string
}

export async function listAssets(): Promise<Asset[]> {
  const data = await apiFetch("/api/assets")
  return data.assets
}

export async function registerAsset(input: RegisterAssetInput): Promise<Asset> {
  const data = await apiFetch("/api/assets", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.asset
}
