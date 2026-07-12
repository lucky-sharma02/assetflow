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
