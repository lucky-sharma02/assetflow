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
import { departmentFormSchema, type DepartmentFormValues } from "./schemas"
import type { Department } from "./types"

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
  const isEditing = Boolean(department)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: department?.name ?? "" },
  })

  useEffect(() => {
    reset({ name: department?.name ?? "" })
    setFormError(null)
  }, [department, open, reset])

  const submit = async (values: DepartmentFormValues) => {
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
