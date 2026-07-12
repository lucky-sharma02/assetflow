import { apiFetch } from "@/lib/api"
import type {
  AssetUtilizationReport,
  DepartmentAllocationItem,
  MaintenanceFrequencyItem,
} from "./types"

export async function getAssetUtilizationReport(): Promise<AssetUtilizationReport> {
  return apiFetch("/api/reports/asset-utilization")
}

export async function getMaintenanceFrequencyReport(): Promise<MaintenanceFrequencyItem[]> {
  const data = await apiFetch("/api/reports/maintenance-frequency")
  return data.items
}

export async function getDepartmentAllocationReport(): Promise<DepartmentAllocationItem[]> {
  const data = await apiFetch("/api/reports/department-allocation")
  return data.items
}
