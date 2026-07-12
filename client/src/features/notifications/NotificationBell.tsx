import { Bell } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./api"
import type { Notification } from "./types"

// REST polling per the locked stack (CLAUDE.md Section 2: "Notifications:
// In-app only -- Notification table, polled via REST"). 30s is frequent
// enough for a hackathon-scope in-app panel without hammering the API --
// no shared polling helper existed anywhere else in the codebase to reuse,
// so this is a plain useEffect + setInterval, not a new abstraction.
const POLL_INTERVAL_MS = 30_000

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const refresh = () => {
    listNotifications()
      .then((data) => {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      })
      .catch(() => {
        // Best-effort UI widget -- a failed poll just skips this tick
        // rather than surfacing an error banner over the whole app.
      })
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return
    await markNotificationRead(notification.id)
    refresh()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    refresh()
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen((v) => !v)} aria-label="Notifications">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border bg-popover shadow-md">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`block w-full border-b p-3 text-left text-sm last:border-b-0 hover:bg-accent ${
                    n.isRead ? "" : "bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
