import { apiFetch } from "@/lib/api"
import type { MaintenanceRequestFormValues } from "./schemas"
import type { MaintenanceRequest } from "./types"

export async function raiseMaintenanceRequest(
  values: MaintenanceRequestFormValues,
  photo: File | null
): Promise<MaintenanceRequest> {
  const formData = new FormData()
  formData.set("assetId", values.assetId)
  formData.set("issueDescription", values.issueDescription)
  if (photo) {
    formData.set("photo", photo)
  }

  const data = await apiFetch("/api/maintenance", {
    method: "POST",
    body: formData,
  })
  return data.maintenanceRequest
}

export async function approveMaintenanceRequest(id: string): Promise<MaintenanceRequest> {
  const data = await apiFetch(`/api/maintenance/${id}/approve`, { method: "PATCH" })
  return data.maintenanceRequest
}

export async function rejectMaintenanceRequest(
  id: string,
  notes?: string
): Promise<MaintenanceRequest> {
  const data = await apiFetch(`/api/maintenance/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  })
  return data.maintenanceRequest
}

export async function resolveMaintenanceRequest(id: string): Promise<MaintenanceRequest> {
  const data = await apiFetch(`/api/maintenance/${id}/resolve`, { method: "PATCH" })
  return data.maintenanceRequest
}
