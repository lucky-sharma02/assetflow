export interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
  userId: string | null
  user: { id: string; name: string; email: string } | null
}

export interface ActivityLogFilters {
  entityType?: string
  entityId?: string
  limit?: number
  offset?: number
}
