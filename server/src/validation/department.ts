import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  headId: z.string().min(1).optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  headId: z.string().min(1).nullable().optional(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
