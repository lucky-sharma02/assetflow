import { z } from "zod";

export const promoteRoleSchema = z.object({
  role: z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]),
});

export type PromoteRoleInput = z.infer<typeof promoteRoleSchema>;
