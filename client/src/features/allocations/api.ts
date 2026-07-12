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

export async function returnAllocation(
  allocationId: string,
  conditionAtReturn: AssetCondition,
  notes?: string
): Promise<Allocation> {
  const data = await apiFetch(`/api/allocations/${allocationId}/return`, {
    method: "PATCH",
    body: JSON.stringify({ conditionAtReturn, notes }),
  })
  return data.allocation
}
