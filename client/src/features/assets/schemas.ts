import { z } from "zod"
import { ASSET_CONDITIONS } from "./types"

export const registerAssetFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().nullable().optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  serialNumber: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type RegisterAssetFormValues = z.infer<typeof registerAssetFormSchema>
