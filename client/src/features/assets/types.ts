export const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED"] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

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

interface UserSummary {
  id: string
  name: string
  email: string
}

export interface AssetAllocation {
  id: string
  status: string
  allocatedAt: string
  dueDate: string | null
  returnedAt: string | null
  holder: UserSummary
  allocatedBy: UserSummary
}

export interface AssetTransferRequest {
  id: string
  status: string
  requestedAt: string
  fromUser: UserSummary | null
  toUser: UserSummary
  requestedBy: UserSummary
}

export interface AssetBooking {
  id: string
  status: string
  startTime: string
  endTime: string
  bookedBy: UserSummary
}

export interface AssetMaintenanceRequest {
  id: string
  status: string
  requestedAt: string
  issueDescription: string
  requestedBy: UserSummary
}

export interface AssetAuditRecord {
  id: string
  verifiedAt: string
  foundStatus: AssetStatus
  foundCondition: AssetCondition
  isDiscrepant: boolean
  verifiedBy: UserSummary
  auditCycle: { id: string; name: string }
}

export interface AssetDetail extends Asset {
  allocations: AssetAllocation[]
  transferRequests: AssetTransferRequest[]
  bookings: AssetBooking[]
  maintenanceRequests: AssetMaintenanceRequest[]
  auditRecords: AssetAuditRecord[]
}

export interface AssetFilters {
  search?: string
  categoryId?: string
  departmentId?: string
  status?: AssetStatus
  condition?: AssetCondition
}
