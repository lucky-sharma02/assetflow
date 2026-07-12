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
import { listCategories } from "@/features/categories/api"
import type { Category } from "@/features/categories/types"
import { listDepartments } from "@/features/departments/api"
import type { Department } from "@/features/departments/types"
import { registerAssetFormSchema, type RegisterAssetFormValues } from "./schemas"
import { ASSET_CONDITIONS } from "./types"

const NO_DEPARTMENT = "__none__"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RegisterAssetFormValues) => Promise<void>
}

export function AssetFormDialog({ open, onOpenChange, onSubmit }: AssetFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAssetFormValues>({
    resolver: zodResolver(registerAssetFormSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      departmentId: null,
      condition: "GOOD",
      isBookable: false,
    },
  })

  useEffect(() => {
    if (!open) return
    reset({ name: "", categoryId: "", departmentId: null, condition: "GOOD", isBookable: false })
    setFormError(null)
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
    listDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]))
  }, [open, reset])

  const submit = async (values: RegisterAssetFormValues) => {
    setFormError(null)
    try {
      await onSubmit({
        ...values,
        departmentId: values.departmentId === NO_DEPARTMENT ? null : values.departmentId,
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
          <DialogTitle>Register asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input id="asset-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-category">Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="asset-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-department">Department</Label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_DEPARTMENT}
                  onValueChange={(value) =>
                    field.onChange(value === NO_DEPARTMENT ? null : value)
                  }
                >
                  <SelectTrigger id="asset-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>Unassigned</SelectItem>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-condition">Condition</Label>
            <Controller
              control={control}
              name="condition"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="asset-condition">
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

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isBookable"
              render={({ field }) => (
                <Checkbox
                  id="asset-is-bookable"
                  checked={field.value ?? false}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="asset-is-bookable">Bookable (appears in the resource booking flow)</Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-serial">Serial number</Label>
            <Input id="asset-serial" {...register("serialNumber")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-location">Location</Label>
            <Input id="asset-location" {...register("location")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-notes">Notes</Label>
            <Input id="asset-notes" {...register("notes")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
