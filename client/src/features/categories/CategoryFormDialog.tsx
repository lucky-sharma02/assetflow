import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
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
import { categoryFormSchema, type CategoryFormValues } from "./schemas"
import type { Category } from "./types"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSubmit: (values: CategoryFormValues) => Promise<void>
}

function toDefaultValues(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    extraFields: category?.extraFields
      ? Object.entries(category.extraFields).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      : [],
  }
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const isEditing = Boolean(category)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toDefaultValues(category),
  })

  const { fields, append, remove } = useFieldArray({ control, name: "extraFields" })

  useEffect(() => {
    reset(toDefaultValues(category))
    setFormError(null)
  }, [category, open, reset])

  const submit = async (values: CategoryFormValues) => {
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
          <DialogTitle>{isEditing ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-description">Description</Label>
            <Input id="category-description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Extra fields</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: "", value: "" })}
              >
                Add field
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                e.g. warrantyMonths: 12
              </p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input placeholder="Field name" {...register(`extraFields.${index}.key`)} />
                  {errors.extraFields?.[index]?.key && (
                    <p className="text-sm text-destructive">
                      {errors.extraFields[index]?.key?.message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <Input placeholder="Value" {...register(`extraFields.${index}.value`)} />
                  {errors.extraFields?.[index]?.value && (
                    <p className="text-sm text-destructive">
                      {errors.extraFields[index]?.value?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
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
