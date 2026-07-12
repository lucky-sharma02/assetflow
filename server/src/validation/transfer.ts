import { z } from "zod";

const TRANSFER_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;

export const createTransferSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  toUserId: z.string().min(1, "Recipient is required"),
  reason: z.string().trim().max(2000).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export const transferQuerySchema = z.object({
  assetId: z.string().min(1).optional(),
  toUserId: z.string().min(1).optional(),
  fromUserId: z.string().min(1).optional(),
  status: z.enum(TRANSFER_STATUSES).optional(),
});

export type TransferQueryInput = z.infer<typeof transferQuerySchema>;
