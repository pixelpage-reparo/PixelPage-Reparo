import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="border-muted-foreground/30 border-t-primary size-8 animate-spin rounded-full border-2" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
