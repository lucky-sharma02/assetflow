import { z } from "zod";

export const activityLogQuerySchema = z.object({
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ActivityLogQueryInput = z.infer<typeof activityLogQuerySchema>;
