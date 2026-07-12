import { Navigate, Outlet } from "react-router-dom"
import { NotificationBell } from "@/features/notifications/NotificationBell"
import { useAuth } from "@/lib/auth"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Mounted once here rather than in every individual page component --
  // this codebase has no shared page layout/header (each feature page owns
  // its own container), so ProtectedRoute's wrapping <Outlet> is the one
  // place that's guaranteed to render on every authenticated route.
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-end border-b p-2">
        <NotificationBell />
      </header>
      <Outlet />
    </div>
  )
}
