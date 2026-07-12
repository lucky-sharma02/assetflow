import { z } from "zod"

export const createAuditCycleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    departmentId: z.string().nullable(),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().min(1, "End date is required"),
    auditorIds: z.array(z.string()).min(1, "At least one auditor is required"),
  })
  .refine((data) => !data.startDate || data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })

export type CreateAuditCycleFormValues = z.infer<typeof createAuditCycleFormSchema>
