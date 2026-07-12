import { z } from "zod"

export const extraFieldEntrySchema = z.object({
  key: z.string().trim().min(1, "Field name is required"),
  value: z.string().trim().min(1, "Field value is required"),
})

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  extraFields: z.array(extraFieldEntrySchema),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
