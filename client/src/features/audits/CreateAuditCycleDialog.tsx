import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { listDepartments } from "@/features/departments/api"
import type { Department } from "@/features/departments/types"
import { listUsers } from "@/features/users/api"
import type { DirectoryUser } from "@/features/users/types"
import { createAuditCycleFormSchema, type CreateAuditCycleFormValues } from "./schemas"

const ALL_DEPARTMENTS = "__all_departments__"

interface CreateAuditCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateAuditCycleFormValues) => Promise<void>
}

export function CreateAuditCycleDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAuditCycleDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<DirectoryUser[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAuditCycleFormValues>({
    resolver: zodResolver(createAuditCycleFormSchema),
    defaultValues: {
      name: "",
      departmentId: null,
      startDate: "",
      endDate: "",
      auditorIds: [],
    },
  })

  useEffect(() => {
    if (!open) return
    reset({ name: "", departmentId: null, startDate: "", endDate: "", auditorIds: [] })
    setFormError(null)
    listDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]))
    listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [open, reset])

  const submit = async (values: CreateAuditCycleFormValues) => {
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
          <DialogTitle>New audit cycle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audit-name">Name</Label>
            <Input id="audit-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audit-department">Scope</Label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ALL_DEPARTMENTS}
                  onValueChange={(value) =>
                    field.onChange(value === ALL_DEPARTMENTS ? null : value)
                  }
                >
                  <SelectTrigger id="audit-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_DEPARTMENTS}>All departments (org-wide)</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="audit-start">Start date</Label>
              <Input id="audit-start" type="date" {...register("startDate")} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="audit-end">End date</Label>
              <Input id="audit-end" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Auditors</Label>
            <Controller
              control={control}
              name="auditorIds"
              render={({ field }) => (
                <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border p-2">
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users available.</p>
                  )}
                  {users.map((u) => {
                    const checked = field.value.includes(u.id)
                    return (
                      <div key={u.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`auditor-${u.id}`}
                          checked={checked}
                          onCheckedChange={(next) => {
                            field.onChange(
                              next === true
                                ? [...field.value, u.id]
                                : field.value.filter((id) => id !== u.id)
                            )
                          }}
                        />
                        <Label htmlFor={`auditor-${u.id}`} className="font-normal">
                          {u.name} ({u.role})
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}
            />
            {errors.auditorIds && (
              <p className="text-sm text-destructive">{errors.auditorIds.message}</p>
            )}
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create cycle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
