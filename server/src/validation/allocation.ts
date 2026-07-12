import { z } from "zod";

const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;
const ALLOCATION_STATUSES = ["ACTIVE", "RETURNED"] as const;

export const createAllocationSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  holderId: z.string().min(1, "Holder is required"),
  dueDate: z.coerce.date().optional(),
  conditionAtAllocation: z.enum(ASSET_CONDITIONS).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;

export const allocationQuerySchema = z.object({
  assetId: z.string().min(1).optional(),
  holderId: z.string().min(1).optional(),
  status: z.enum(ALLOCATION_STATUSES).optional(),
});

export type AllocationQueryInput = z.infer<typeof allocationQuerySchema>;
