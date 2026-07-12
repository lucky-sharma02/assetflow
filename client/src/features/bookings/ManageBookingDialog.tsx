import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toLocalInputValue } from "./datetime"
import { rescheduleFormSchema, type RescheduleFormValues } from "./schemas"
import type { Booking } from "./types"

interface ManageBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
  onReschedule: (values: RescheduleFormValues) => Promise<void>
  onCancel: () => Promise<void>
}

export function ManageBookingDialog({
  open,
  onOpenChange,
  booking,
  onReschedule,
  onCancel,
}: ManageBookingDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleFormSchema),
    defaultValues: { startTime: "", endTime: "" },
  })

  useEffect(() => {
    if (!open || !booking) return
    reset({
      startTime: toLocalInputValue(booking.startTime),
      endTime: toLocalInputValue(booking.endTime),
    })
    setError(null)
  }, [open, booking, reset])

  if (!booking) return null

  const submitReschedule = async (values: RescheduleFormValues) => {
    setError(null)
    try {
      await onReschedule(values)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const handleCancelBooking = async () => {
    if (!confirm("Cancel this booking?")) return
    setError(null)
    setIsCancelling(true)
    try {
      await onCancel()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage booking</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Booked by {booking.bookedBy.name}
          {booking.purpose ? ` — ${booking.purpose}` : ""}
        </p>
        <form onSubmit={handleSubmit(submitReschedule)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reschedule-start">Start</Label>
            <Input id="reschedule-start" type="datetime-local" {...register("startTime")} />
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reschedule-end">End</Label>
            <Input id="reschedule-end" type="datetime-local" {...register("endTime")} />
            {errors.endTime && (
              <p className="text-sm text-destructive">{errors.endTime.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={isCancelling}
              onClick={handleCancelBooking}
            >
              {isCancelling ? "Cancelling..." : "Cancel booking"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
