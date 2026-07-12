import type { Role } from "@/lib/auth"

export interface DirectoryUser {
  id: string
  name: string
  email: string
  role: Role
  departmentId: string | null
  department: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export const ROLES: Role[] = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]
