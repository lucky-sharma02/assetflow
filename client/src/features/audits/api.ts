import { apiFetch } from "@/lib/api"
import type { AuditCycle, PendingAuditItem } from "./types"

export interface CreateAuditCycleInput {
  name: string
  departmentId?: string
  startDate?: string
  endDate: string
  auditorIds: string[]
}

export async function listAuditCycles(): Promise<AuditCycle[]> {
  const data = await apiFetch("/api/audits")
  return data.auditCycles
}

export async function createAuditCycle(input: CreateAuditCycleInput): Promise<AuditCycle> {
  const data = await apiFetch("/api/audits", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.auditCycle
}

export async function listMyPendingItems(): Promise<PendingAuditItem[]> {
  const data = await apiFetch("/api/audits/my-pending-items")
  return data.items
}

export interface RecordAuditResultInput {
  foundStatus: string
  foundCondition: string
  discrepancyNotes?: string
}

export async function recordAuditResult(
  cycleId: string,
  itemId: string,
  input: RecordAuditResultInput
): Promise<PendingAuditItem> {
  const data = await apiFetch(`/api/audits/${cycleId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
  return data.item
}
