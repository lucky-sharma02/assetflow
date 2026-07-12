export interface AuditCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
  departmentId: string | null
  department: { id: string; name: string } | null
  createdBy: { id: string; name: string; email: string }
  _count: { assignments: number; records: number }
}

export interface DiscrepancyReportItem {
  id: string
  foundStatus: string | null
  foundCondition: string | null
  isDiscrepant: boolean
  discrepancyNotes: string | null
  verifiedAt: string | null
  auditCycleId: string
  assetId: string
  asset: {
    id: string
    assetTag: string
    name: string
    status: string
    condition: string
  }
  verifiedBy: { id: string; name: string; email: string } | null
}

export interface PendingAuditItem {
  id: string
  isDiscrepant: boolean
  discrepancyNotes: string | null
  createdAt: string
  auditCycleId: string
  assetId: string
  asset: {
    id: string
    assetTag: string
    name: string
    status: string
    condition: string
  }
  auditCycle: { id: string; name: string; endDate: string }
}
