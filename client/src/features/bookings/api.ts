import { apiFetch } from "@/lib/api"
import type { Booking } from "./types"

export interface CreateBookingInput {
  assetId: string
  startTime: string
  endTime: string
  purpose?: string
}

export interface RescheduleBookingInput {
  startTime: string
  endTime: string
}

export async function listBookings(assetId: string): Promise<Booking[]> {
  const data = await apiFetch(`/api/bookings?assetId=${assetId}`)
  return data.bookings
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const data = await apiFetch("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return data.booking
}

export async function cancelBooking(id: string): Promise<Booking> {
  const data = await apiFetch(`/api/bookings/${id}/cancel`, { method: "PATCH" })
  return data.booking
}

export async function rescheduleBooking(
  id: string,
  input: RescheduleBookingInput
): Promise<Booking> {
  const data = await apiFetch(`/api/bookings/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
  return data.booking
}
