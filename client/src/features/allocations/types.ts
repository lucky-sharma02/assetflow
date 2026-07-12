import type { AssetCondition } from "@/features/assets/types"

interface UserSummary {
  id: string
  name: string
  email: string
}

export interface Allocation {
  id: string
  status: "ACTIVE" | "RETURNED"
  allocatedAt: string
  dueDate: string | null
  returnedAt: string | null
  conditionAtAllocation: AssetCondition
  conditionAtReturn: AssetCondition | null
  notes: string | null
  asset: { id: string; assetTag: string; name: string }
  holder: UserSummary
  allocatedBy: UserSummary
  isOverdue: boolean
}

export interface AllocationConflictDetails {
  allocationId: string
  holder: UserSummary
  allocatedAt: string
  dueDate: string | null
}
