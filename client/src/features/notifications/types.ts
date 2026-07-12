export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedEntityType: string | null
  relatedEntityId: string | null
}
