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
import { bookingFormSchema, type BookingFormValues } from "./schemas"

interface BookingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetId: string
  initialRange: { start: string; end: string } | null
  onSubmit: (values: BookingFormValues) => Promise<void>
}

export function BookingFormDialog({
  open,
  onOpenChange,
  assetId,
  initialRange,
  onSubmit,
}: BookingFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { assetId, startTime: "", endTime: "", purpose: "" },
  })

  useEffect(() => {
    if (!open) return
    reset({
      assetId,
      startTime: initialRange ? toLocalInputValue(initialRange.start) : "",
      endTime: initialRange ? toLocalInputValue(initialRange.end) : "",
      purpose: "",
    })
    setFormError(null)
  }, [open, assetId, initialRange, reset])

  const submit = async (values: BookingFormValues) => {
    setFormError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-start">Start</Label>
            <Input id="booking-start" type="datetime-local" {...register("startTime")} />
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-end">End</Label>
            <Input id="booking-end" type="datetime-local" {...register("endTime")} />
            {errors.endTime && (
              <p className="text-sm text-destructive">{errors.endTime.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-purpose">Purpose</Label>
            <Input id="booking-purpose" {...register("purpose")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Booking..." : "Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
