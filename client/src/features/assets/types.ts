export type AssetStatus = "AVAILABLE" | "ALLOCATED" | "UNDER_MAINTENANCE" | "RETIRED"

export const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const
export type AssetCondition = (typeof ASSET_CONDITIONS)[number]

export interface Asset {
  id: string
  assetTag: string
  name: string
  status: AssetStatus
  condition: AssetCondition
  serialNumber: string | null
  purchaseDate: string | null
  purchaseCost: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  categoryId: string
  category: { id: string; name: string }
  departmentId: string | null
  department: { id: string; name: string } | null
}
