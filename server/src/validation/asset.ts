import { z } from "zod";

const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;
const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED"] as const;

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

export const assetQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
});

export type AssetQueryInput = z.infer<typeof assetQuerySchema>;
