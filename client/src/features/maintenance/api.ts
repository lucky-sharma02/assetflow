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
