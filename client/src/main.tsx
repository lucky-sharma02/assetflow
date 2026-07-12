import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import App from "./App.tsx"
import { LoginPage } from "./features/auth/LoginPage.tsx"
import { SignupPage } from "./features/auth/SignupPage.tsx"
import { DepartmentsPage } from "./features/departments/DepartmentsPage.tsx"
import "./index.css"
import { AuthProvider } from "./lib/auth.tsx"
import { GuestRoute } from "./routes/GuestRoute.tsx"
import { ProtectedRoute } from "./routes/ProtectedRoute.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />} />
            <Route path="/departments" element={<DepartmentsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
