import { apiFetch } from "@/lib/api"
import type { ActivityLog, ActivityLogFilters } from "./types"

export async function listActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLog[]> {
  const params = new URLSearchParams()
  if (filters.entityType) params.set("entityType", filters.entityType)
  if (filters.entityId) params.set("entityId", filters.entityId)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const query = params.toString()
  const data = await apiFetch(`/api/activity-logs${query ? `?${query}` : ""}`)
  return data.logs
}
