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
import { raiseMaintenanceRequest } from "./api"
import { maintenanceRequestFormSchema, type MaintenanceRequestFormValues } from "./schemas"

interface MaintenanceRequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetId: string
  onCreated: () => void
}

export function MaintenanceRequestFormDialog({
  open,
  onOpenChange,
  assetId,
  onCreated,
}: MaintenanceRequestFormDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRequestFormValues>({
    resolver: zodResolver(maintenanceRequestFormSchema),
    defaultValues: { assetId, issueDescription: "" },
  })

  useEffect(() => {
    if (!open) return
    reset({ assetId, issueDescription: "" })
    setPhoto(null)
    setError(null)
  }, [open, assetId, reset])

  const submit = async (values: MaintenanceRequestFormValues) => {
    setError(null)
    try {
      await raiseMaintenanceRequest(values, photo)
      onCreated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maintenance-issue">Issue description</Label>
            <Input id="maintenance-issue" {...register("issueDescription")} />
            {errors.issueDescription && (
              <p className="text-sm text-destructive">{errors.issueDescription.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maintenance-photo">Photo (optional)</Label>
            <Input
              id="maintenance-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
