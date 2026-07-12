import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

function App() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>AssetFlow</CardTitle>
          <CardDescription>
            Know what you have. Know who has it. Know its condition — always.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">
            Signed in as <span className="font-medium">{user?.name}</span> ({user?.role})
          </p>
          <Link to="/departments" className="text-sm underline underline-offset-4">
            Manage departments
          </Link>
          <Link to="/categories" className="text-sm underline underline-offset-4">
            Manage asset categories
          </Link>
          <Link to="/assets" className="text-sm underline underline-offset-4">
            View assets
          </Link>
          <Link to="/bookings" className="text-sm underline underline-offset-4">
            Book a resource
          </Link>
          <Link to="/transfers" className="text-sm underline underline-offset-4">
            Transfer requests
          </Link>
          {(user?.role === "ADMIN" || user?.role === "ASSET_MANAGER") && (
            <Link to="/dashboard" className="text-sm underline underline-offset-4">
              Dashboard
            </Link>
          )}
          {(user?.role === "ADMIN" || user?.role === "ASSET_MANAGER") && (
            <Link to="/reports" className="text-sm underline underline-offset-4">
              Reports & analytics
            </Link>
          )}
          {(user?.role === "ADMIN" || user?.role === "ASSET_MANAGER") && (
            <Link to="/employees" className="text-sm underline underline-offset-4">
              Employee directory
            </Link>
          )}
          {(user?.role === "ADMIN" || user?.role === "ASSET_MANAGER") && (
            <Link to="/allocations/overdue" className="text-sm underline underline-offset-4">
              Overdue allocations
            </Link>
          )}
          <Link to="/audits" className="text-sm underline underline-offset-4">
            Audit cycles
          </Link>
          <Link to="/audits/my-items" className="text-sm underline underline-offset-4">
            My audit items
          </Link>
          <Button variant="outline" onClick={() => logout()}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
