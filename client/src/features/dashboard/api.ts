import { apiFetch } from "@/lib/api"
import type { DashboardSummary } from "./types"

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/api/dashboard")
}
