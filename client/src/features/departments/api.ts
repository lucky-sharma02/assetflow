import { apiFetch } from "@/lib/api"
import type { Department } from "./types"

export async function listDepartments(): Promise<Department[]> {
  const data = await apiFetch("/api/departments")
  return data.departments
}

export async function createDepartment(name: string, headId?: string | null): Promise<Department> {
  const data = await apiFetch("/api/departments", {
    method: "POST",
    body: JSON.stringify({ name, headId: headId ?? undefined }),
  })
  return data.department
}

export async function updateDepartment(
  id: string,
  name: string,
  headId?: string | null
): Promise<Department> {
  const data = await apiFetch(`/api/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, headId }),
  })
  return data.department
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch(`/api/departments/${id}`, { method: "DELETE" })
}
