import { z } from "zod"

export const bookingFormSchema = z
  .object({
    assetId: z.string().min(1, "Asset is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    purpose: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })

export type BookingFormValues = z.infer<typeof bookingFormSchema>

export const rescheduleFormSchema = z
  .object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })

export type RescheduleFormValues = z.infer<typeof rescheduleFormSchema>
