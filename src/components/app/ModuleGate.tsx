import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { EmptyState } from "@/components/shared/EmptyState"
import { useModuleAccess } from "@/hooks/use-permissions"
import { useAuth } from "@/hooks/use-auth"
import type { ModuleKey } from "@/types/domain"
import { ShieldAlert } from "lucide-react"

interface ModuleGateProps {
  module: ModuleKey
  children: ReactNode
}

/**
 * Route-level guard: hides a module's page from an employee the owner
 * hasn't granted access to. Dashboard itself is never gated (everyone who's
 * authenticated has somewhere to land) — redirect there instead of blanking
 * the screen for a module with no access.
 */
export function ModuleGate({ module, children }: ModuleGateProps) {
  const hasAccess = useModuleAccess(module)
  const { profile } = useAuth()

  if (!profile) return null

  if (!hasAccess) {
    if (module === "dashboard") {
      return (
        <EmptyState
          icon={ShieldAlert}
          title="Sem acesso a este módulo"
          description="Fale com o dono da assistência pra liberar o acesso ao Dashboard."
        />
      )
    }
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
