import { z } from "zod";

const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;

export const registerAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().min(1).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  serialNumber: z.string().trim().max(120).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchaseCost: z.coerce.number().nonnegative().optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type RegisterAssetInput = z.infer<typeof registerAssetSchema>;
