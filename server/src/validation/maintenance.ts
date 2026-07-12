import { z } from "zod";

// photoUrl is deliberately not part of this schema — it comes from the
// multer-parsed file on the request, not the JSON/multipart text fields,
// and is validated by multer's fileFilter (see lib/multer.ts), not Zod.
export const createMaintenanceRequestSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  issueDescription: z.string().trim().min(1, "Issue description is required").max(2000),
});

export type CreateMaintenanceRequestInput = z.infer<typeof createMaintenanceRequestSchema>;

export const rejectMaintenanceRequestSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export type RejectMaintenanceRequestInput = z.infer<typeof rejectMaintenanceRequestSchema>;
