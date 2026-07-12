import { apiFetch } from "@/lib/api"
import type { AuditCycle } from "./types"

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
