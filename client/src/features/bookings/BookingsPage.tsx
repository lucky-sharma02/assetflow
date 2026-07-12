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
import { BookingFormDialog } from "./BookingFormDialog"
import { createBooking, listBookings } from "./api"
import type { BookingFormValues } from "./schemas"
import type { Booking } from "./types"

export function BookingsPage() {
  const [bookableAssets, setBookableAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)

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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
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
            <SelectTrigger className="w-64">
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

          <div className="rounded-md border p-2">
            <FullCalendar
              key={selectedAssetId}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              height="auto"
              selectable
              select={(info) => {
                setSelectedRange({ start: info.startStr, end: info.endStr })
                setDialogOpen(true)
              }}
              events={bookings.map((b) => ({
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
        </>
      )}
    </div>
  )
}
