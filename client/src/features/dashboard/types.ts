export interface DashboardSummary {
  assets: {
    total: number
    byStatus: { status: string; count: number }[]
  }
  allocations: { active: number; overdue: number }
  transfers: { pending: number }
  maintenance: { pending: number }
  bookings: { upcoming: number }
}
