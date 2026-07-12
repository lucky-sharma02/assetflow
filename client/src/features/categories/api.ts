import { apiFetch } from "@/lib/api"
import type { Category, ExtraFieldValue } from "./types"

export interface CategoryInput {
  name: string
  description?: string
  extraFields?: Record<string, ExtraFieldValue> | null
}

export async function listCategories(): Promise<Category[]> {
  const data = await apiFetch("/api/categories")
  return data.categories
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const data = await apiFetch("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.category
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const data = await apiFetch(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
  return data.category
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/api/categories/${id}`, { method: "DELETE" })
}
