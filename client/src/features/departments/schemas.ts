import { z } from "zod"

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
