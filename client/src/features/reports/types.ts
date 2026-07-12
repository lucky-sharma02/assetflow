export interface AssetUtilizationReport {
  total: number
  byStatus: { status: string; count: number; percentage: number }[]
}

export interface MaintenanceFrequencyItem {
  assetId: string
  assetName: string
  assetTag: string
  requestCount: number
}

export interface DepartmentAllocationItem {
  departmentId: string
  departmentName: string
  totalAssets: number
  allocatedAssets: number
  percentage: number
}
