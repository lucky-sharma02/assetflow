import { apiFetch } from "@/lib/api"
import type { Notification } from "./types"

export async function listNotifications(): Promise<{
  notifications: Notification[]
  unreadCount: number
}> {
  const data = await apiFetch("/api/notifications")
  return { notifications: data.notifications, unreadCount: data.unreadCount }
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const data = await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" })
  return data.notification
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/read-all", { method: "PATCH" })
}
