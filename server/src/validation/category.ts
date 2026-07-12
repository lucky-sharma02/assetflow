import { z } from "zod";

const extraFieldsSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .optional();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  extraFields: extraFieldsSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  extraFields: extraFieldsSchema.nullable(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
