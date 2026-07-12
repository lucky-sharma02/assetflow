import { z } from "zod";

const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;
// LOST (added to the Prisma AssetStatus enum in #27) was missing here —
// found and fixed in #34 while verifying seed data could actually be
// queried/filtered: GET /api/assets?status=LOST was rejected with a
// validation error even though LOST assets genuinely exist (produced by
// closeCycle()). reportService.ts's own copy of this list already included
// LOST since #31; this one and dashboardService.ts's didn't.
const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED", "LOST"] as const;

export const registerAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().min(1).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  isBookable: z.boolean().optional(),
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
  isBookable: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export type AssetQueryInput = z.infer<typeof assetQuerySchema>;
