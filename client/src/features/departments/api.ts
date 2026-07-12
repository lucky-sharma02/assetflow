import { apiFetch } from "@/lib/api"
import type { Department } from "./types"

export async function listDepartments(): Promise<Department[]> {
  const data = await apiFetch("/api/departments")
  return data.departments
}

export async function createDepartment(name: string): Promise<Department> {
  const data = await apiFetch("/api/departments", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return data.department
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  const data = await apiFetch(`/api/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
  return data.department
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch(`/api/departments/${id}`, { method: "DELETE" })
}
