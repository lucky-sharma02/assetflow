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
import { ASSET_CONDITIONS, type AssetCondition } from "@/features/assets/types"

interface ReturnFormValues {
  conditionAtReturn: AssetCondition
  notes: string
}

interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCondition?: AssetCondition
  onReturn: (conditionAtReturn: AssetCondition, notes?: string) => Promise<void>
}

export function ReturnDialog({
  open,
  onOpenChange,
  currentCondition,
  onReturn,
}: ReturnDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReturnFormValues>({
    defaultValues: { conditionAtReturn: currentCondition ?? "GOOD", notes: "" },
  })

  useEffect(() => {
    if (!open) return
    reset({ conditionAtReturn: currentCondition ?? "GOOD", notes: "" })
    setFormError(null)
  }, [open, currentCondition, reset])

  const submit = async (values: ReturnFormValues) => {
    setFormError(null)
    try {
      await onReturn(values.conditionAtReturn, values.notes || undefined)
      onOpenChange(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-condition">Condition on return</Label>
            <Controller
              control={control}
              name="conditionAtReturn"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="return-condition">
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
            <Label htmlFor="return-notes">Notes (optional)</Label>
            <Input id="return-notes" {...register("notes")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Returning..." : "Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
