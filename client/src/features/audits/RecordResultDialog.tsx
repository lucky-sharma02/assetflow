import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASSET_CONDITIONS, ASSET_STATUSES } from "@/features/assets/types"
import { recordResultFormSchema, type RecordResultFormValues } from "./schemas"
import type { PendingAuditItem } from "./types"

interface RecordResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PendingAuditItem | null
  onSubmit: (values: RecordResultFormValues) => Promise<void>
}

export function RecordResultDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: RecordResultDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<RecordResultFormValues>({
    resolver: zodResolver(recordResultFormSchema),
    defaultValues: { foundStatus: "AVAILABLE", foundCondition: "GOOD", discrepancyNotes: "" },
  })

  useEffect(() => {
    if (!open || !item) return
    reset({
      foundStatus: item.asset.status as RecordResultFormValues["foundStatus"],
      foundCondition: item.asset.condition as RecordResultFormValues["foundCondition"],
      discrepancyNotes: "",
    })
    setFormError(null)
  }, [open, item, reset])

  if (!item) return null

  const submit = async (values: RecordResultFormValues) => {
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
          <DialogTitle>Verify {item.asset.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {item.asset.assetTag} · System of record: {item.asset.status} / {item.asset.condition}
        </p>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="found-status">Found status</Label>
            <Controller
              control={control}
              name="foundStatus"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="found-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="found-condition">Found condition</Label>
            <Controller
              control={control}
              name="foundCondition"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="found-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discrepancy-notes">Notes (optional)</Label>
            <Input id="discrepancy-notes" {...register("discrepancyNotes")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Record result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
