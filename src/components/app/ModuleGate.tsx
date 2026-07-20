"use client"

import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect } from "react"

import { EmptyState } from "@/components/shared/EmptyState"
import { useModuleAccess } from "@/hooks/use-permissions"
import type { ModuleKey } from "@/types/domain"

interface ModuleGateProps {
  module: ModuleKey
  children: ReactNode
}

/**
 * Route-level guard: hides a module's page from an employee the owner
 * hasn't granted access to. Dashboard itself is never gated (everyone who's
 * authenticated has somewhere to land) — redirect there instead of blanking
 * the screen for a module with no access. RequireCompany-equivalent
 * (app/app/layout.tsx) already guarantees a profile exists before /app/*
 * renders, so no profile check is needed here.
 */
export function ModuleGate({ module, children }: ModuleGateProps) {
  const hasAccess = useModuleAccess(module)
  const router = useRouter()

  useEffect(() => {
    if (!hasAccess && module !== "dashboard") {
      router.replace("/app/dashboard")
    }
  }, [hasAccess, module, router])

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
    return null
  }

  return <>{children}</>
}
