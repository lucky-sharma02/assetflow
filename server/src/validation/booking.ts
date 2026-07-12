import { z } from "zod";

export const createBookingSchema = z
  .object({
    assetId: z.string().min(1, "Asset is required"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    purpose: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingQuerySchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
});

export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
