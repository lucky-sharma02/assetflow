import { z } from "zod"

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  headId: z.string().nullable().optional(),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
