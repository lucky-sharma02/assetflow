export type ExtraFieldValue = string | number | boolean

export interface Category {
  id: string
  name: string
  description: string | null
  extraFields: Record<string, ExtraFieldValue> | null
  createdAt: string
  updatedAt: string
}
