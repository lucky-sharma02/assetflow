import { apiFetch } from "@/lib/api"
import type { Transfer } from "./types"

export interface TransferFilters {
  assetId?: string
  toUserId?: string
  fromUserId?: string
  status?: string
}

export async function listTransfers(filters: TransferFilters = {}): Promise<Transfer[]> {
  const params = new URLSearchParams()
  if (filters.assetId) params.set("assetId", filters.assetId)
  if (filters.toUserId) params.set("toUserId", filters.toUserId)
  if (filters.fromUserId) params.set("fromUserId", filters.fromUserId)
  if (filters.status) params.set("status", filters.status)

  const query = params.toString()
  const data = await apiFetch(`/api/transfers${query ? `?${query}` : ""}`)
  return data.transfers
}

export async function createTransfer(
  assetId: string,
  toUserId: string,
  reason?: string
): Promise<Transfer> {
  const data = await apiFetch("/api/transfers", {
    method: "POST",
    body: JSON.stringify({ assetId, toUserId, reason }),
  })
  return data.transfer
}

export async function approveTransfer(id: string): Promise<Transfer> {
  const data = await apiFetch(`/api/transfers/${id}/approve`, { method: "PATCH" })
  return data.transfer
}

export async function rejectTransfer(id: string): Promise<Transfer> {
  const data = await apiFetch(`/api/transfers/${id}/reject`, { method: "PATCH" })
  return data.transfer
}
