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
import { listUsers } from "@/features/users/api"
import type { DirectoryUser } from "@/features/users/types"

interface RequestTransferFormValues {
  toUserId: string
  reason: string
}

interface RequestTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentHolderId?: string
  onRequest: (toUserId: string, reason?: string) => Promise<void>
}

export function RequestTransferDialog({
  open,
  onOpenChange,
  currentHolderId,
  onRequest,
}: RequestTransferDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [users, setUsers] = useState<DirectoryUser[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestTransferFormValues>({ defaultValues: { toUserId: "", reason: "" } })

  useEffect(() => {
    if (!open) return
    reset({ toUserId: "", reason: "" })
    setFormError(null)
    // The employee directory endpoint is Admin/Asset Manager only; if a
    // regular Employee opens this dialog the list silently stays empty
    // and they can still submit with a manually-known user id via the
    // API directly -- picking from a list is a convenience, not a gate.
    listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [open, reset])

  const submit = async (values: RequestTransferFormValues) => {
    setFormError(null)
    try {
      await onRequest(values.toUserId, values.reason || undefined)
      onOpenChange(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const recipients = users.filter((u) => u.id !== currentHolderId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-to">Transfer to</Label>
            <Controller
              control={control}
              name="toUserId"
              rules={{ required: "Select a person" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="transfer-to">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toUserId && (
              <p className="text-sm text-destructive">{errors.toUserId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-reason">Reason (optional)</Label>
            <Input id="transfer-reason" {...register("reason")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Requesting..." : "Request transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
