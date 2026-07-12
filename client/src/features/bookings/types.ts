export interface Booking {
  id: string
  status: string
  startTime: string
  endTime: string
  purpose: string | null
  assetId: string
  bookedById: string
  bookedBy: { id: string; name: string; email: string }
}
