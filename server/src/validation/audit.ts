import { z } from "zod";

export const createAuditCycleSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    departmentId: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date(),
    auditorIds: z.array(z.string().min(1)).min(1, "At least one auditor is required"),
  })
  .refine((data) => !data.startDate || data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type CreateAuditCycleInput = z.infer<typeof createAuditCycleSchema>;
