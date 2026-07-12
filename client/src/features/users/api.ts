import { apiFetch } from "@/lib/api"
import type { Role } from "@/lib/auth"
import type { DirectoryUser } from "./types"

export async function listUsers(): Promise<DirectoryUser[]> {
  const data = await apiFetch("/api/users")
  return data.users
}

export async function promoteRole(id: string, role: Role): Promise<DirectoryUser> {
  const data = await apiFetch(`/api/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
  return data.user
}
