import { z } from "zod";

const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;
const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED"] as const;

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

// isDiscrepant is deliberately NOT part of this schema -- the client
// can't be trusted to self-report a discrepancy, so it's derived
// server-side by comparing foundStatus/foundCondition against the
// asset's actual current status/condition at verification time.
export const recordAuditResultSchema = z.object({
  foundStatus: z.enum(ASSET_STATUSES),
  foundCondition: z.enum(ASSET_CONDITIONS),
  discrepancyNotes: z.string().trim().max(2000).optional(),
});

export type RecordAuditResultInput = z.infer<typeof recordAuditResultSchema>;
