import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"

/**
 * Gates /app/* behind having a profile. A session can exist without one —
 * first-time Google sign-in has no equivalent to signUpWithPassword's
 * pending-metadata bootstrap, so it lands here without a company yet.
 */
export function RequireCompany() {
  const { profile } = useAuth()

  if (!profile) {
    return <Navigate to="/complete-signup" replace />
  }

  return <Outlet />
}
