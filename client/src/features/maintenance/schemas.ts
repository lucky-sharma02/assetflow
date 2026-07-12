import { z } from "zod"

// The photo file is handled as separate component state, not part of this
// schema — mirrors the backend, where photoUrl comes from the multer-parsed
// file rather than the JSON/Zod-validated body fields.
export const maintenanceRequestFormSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  issueDescription: z.string().trim().min(1, "Issue description is required").max(2000),
})

export type MaintenanceRequestFormValues = z.infer<typeof maintenanceRequestFormSchema>
