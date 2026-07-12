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
import { ApiError } from "@/lib/api"
import type { AllocationConflictDetails } from "./types"

interface AllocateFormValues {
  holderId: string
  dueDate: string
}

interface AllocateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAllocate: (holderId: string, dueDate?: string) => Promise<void>
}

export function AllocateDialog({ open, onOpenChange, onAllocate }: AllocateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<AllocationConflictDetails | null>(null)
  const [users, setUsers] = useState<DirectoryUser[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AllocateFormValues>({ defaultValues: { holderId: "", dueDate: "" } })

  useEffect(() => {
    if (!open) return
    reset({ holderId: "", dueDate: "" })
    setFormError(null)
    setConflict(null)
    listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [open, reset])

  const submit = async (values: AllocateFormValues) => {
    setFormError(null)
    setConflict(null)
    try {
      await onAllocate(values.holderId, values.dueDate || undefined)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.details) {
        const details = err.details as AllocationConflictDetails
        if (details.holder) {
          setConflict(details)
          return
        }
      }
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="allocate-holder">Assign to</Label>
            <Controller
              control={control}
              name="holderId"
              rules={{ required: "Select a person" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="allocate-holder">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.holderId && (
              <p className="text-sm text-destructive">{errors.holderId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="allocate-due-date">Due date (optional)</Label>
            <Input id="allocate-due-date" type="date" {...register("dueDate")} />
          </div>

          {conflict && (
            <p className="text-sm text-destructive">
              Already allocated to {conflict.holder.name} ({conflict.holder.email}) since{" "}
              {new Date(conflict.allocatedAt).toLocaleDateString()}. A transfer request workflow
              is coming in a later issue.
            </p>
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
