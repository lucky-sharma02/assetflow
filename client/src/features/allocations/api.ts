import { apiFetch } from "@/lib/api"
import type { AssetCondition } from "@/features/assets/types"
import type { Allocation } from "./types"

export interface AllocateAssetInput {
  assetId: string
  holderId: string
  dueDate?: string
  conditionAtAllocation?: AssetCondition
  notes?: string
}

export async function allocateAsset(input: AllocateAssetInput): Promise<Allocation> {
  const data = await apiFetch("/api/allocations", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.allocation
}
