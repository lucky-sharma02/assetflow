interface UserSummary {
  id: string
  name: string
  email: string
}

export type TransferStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED"

export interface Transfer {
  id: string
  status: TransferStatus
  reason: string | null
  requestedAt: string
  approvedAt: string | null
  completedAt: string | null
  asset: { id: string; assetTag: string; name: string; status: string }
  fromUser: UserSummary | null
  toUser: UserSummary
  requestedBy: UserSummary
  approvedBy: UserSummary | null
}
