import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listAssets } from "@/features/assets/api"
import type { Asset } from "@/features/assets/types"
import { useAuth } from "@/lib/auth"
import { BookingFormDialog } from "./BookingFormDialog"
import { ManageBookingDialog } from "./ManageBookingDialog"
import { cancelBooking, createBooking, listBookings, rescheduleBooking } from "./api"
import type { BookingFormValues, RescheduleFormValues } from "./schemas"
import type { Booking } from "./types"

// FullCalendar's timeGridWeek view renders 7 day-columns and doesn't
// switch views based on viewport width on its own -- that's an app-level
// decision, not a single FullCalendar prop. On a narrow (phone-width)
// viewport, timeGridDay (a single day-column) is used instead, so the
// grid isn't forced wider than the screen in the first place. The
// overflow-x-auto wrapper below is the remaining safety net regardless.
const NARROW_VIEWPORT_QUERY = "(max-width: 640px)"

export function BookingsPage() {
  const { user } = useAuth()
  const [bookableAssets, setBookableAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () => window.matchMedia(NARROW_VIEWPORT_QUERY).matches
  )

  useEffect(() => {
    const query = window.matchMedia(NARROW_VIEWPORT_QUERY)
    const handleChange = () => setIsNarrowViewport(query.matches)
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    listAssets({ isBookable: true })
      .then((assets) => {
        setBookableAssets(assets)
        if (assets.length > 0) setSelectedAssetId(assets[0].id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load assets"))
  }, [])

  const refresh = () => {
    if (!selectedAssetId) return
    listBookings(selectedAssetId)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load bookings"))
  }

  useEffect(refresh, [selectedAssetId])

  const handleSubmit = async (values: BookingFormValues) => {
    await createBooking({
      assetId: values.assetId,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      purpose: values.purpose || undefined,
    })
    refresh()
  }

  const canManage = (booking: Booking) =>
    user?.role === "ADMIN" || user?.id === booking.bookedById

  const handleEventClick = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking || !canManage(booking)) return
    setManagingBooking(booking)
    setManageDialogOpen(true)
  }

  const handleReschedule = async (values: RescheduleFormValues) => {
    if (!managingBooking) return
    await rescheduleBooking(managingBooking.id, {
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    })
    refresh()
  }

  const handleCancel = async () => {
    if (!managingBooking) return
    await cancelBooking(managingBooking.id)
    refresh()
  }

  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED")

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Resource booking</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back home
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {bookableAssets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bookable resources yet. An Admin or Asset Manager can mark an asset as
          bookable when registering it.
        </p>
      ) : (
        <>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select a resource" />
            </SelectTrigger>
            <SelectContent>
              {bookableAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name} ({asset.assetTag})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Click your own booking (or any booking, if you're an Admin) to reschedule or
            cancel it.
          </p>

          <div className="overflow-x-auto rounded-md border p-2">
            <FullCalendar
              key={`${selectedAssetId}-${isNarrowViewport}`}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView={isNarrowViewport ? "timeGridDay" : "timeGridWeek"}
              height="auto"
              selectable
              select={(info) => {
                setSelectedRange({ start: info.startStr, end: info.endStr })
                setDialogOpen(true)
              }}
              eventClick={(info) => handleEventClick(info.event.id)}
              events={confirmedBookings.map((b) => ({
                id: b.id,
                title: `${b.bookedBy.name}${b.purpose ? ` — ${b.purpose}` : ""}`,
                start: b.startTime,
                end: b.endTime,
              }))}
            />
          </div>

          <BookingFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            assetId={selectedAssetId}
            initialRange={selectedRange}
            onSubmit={handleSubmit}
          />

          <ManageBookingDialog
            open={manageDialogOpen}
            onOpenChange={setManageDialogOpen}
            booking={managingBooking}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
          />
        </>
      )}
    </div>
  )
}
