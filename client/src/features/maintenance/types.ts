export interface MaintenanceRequest {
  id: string
  status: string
  issueDescription: string
  photoUrl: string | null
  cost: string | null
  notes: string | null
  requestedAt: string
  approvedAt: string | null
  resolvedAt: string | null
  assetId: string
  requestedById: string
  requestedBy: { id: string; name: string; email: string }
}
