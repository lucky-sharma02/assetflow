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
import { listUsers } from "@/features/users/api"
import type { DirectoryUser } from "@/features/users/types"
import { departmentFormSchema, type DepartmentFormValues } from "./schemas"
import type { Department } from "./types"

const NO_HEAD = "__none__"

interface DepartmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department | null
  onSubmit: (values: DepartmentFormValues) => Promise<void>
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
}: DepartmentFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const isEditing = Boolean(department)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: department?.name ?? "", headId: department?.headId ?? null },
  })

  useEffect(() => {
    reset({ name: department?.name ?? "", headId: department?.headId ?? null })
    setFormError(null)
  }, [department, open, reset])

  useEffect(() => {
    if (!open) return
    // Only Admins render this dialog, and only Admin/Asset Manager can
    // list users — safe to call unconditionally here.
    listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [open])

  const submit = async (values: DepartmentFormValues) => {
    setFormError(null)
    try {
      await onSubmit({
        ...values,
        headId: values.headId === NO_HEAD ? null : values.headId,
      })
      onOpenChange(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit department" : "New department"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="department-name">Name</Label>
            <Input id="department-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="department-head">Head</Label>
            <Controller
              control={control}
              name="headId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_HEAD}
                  onValueChange={(value) => field.onChange(value === NO_HEAD ? null : value)}
                >
                  <SelectTrigger id="department-head">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_HEAD}>No head assigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
