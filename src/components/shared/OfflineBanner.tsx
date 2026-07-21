"use client"

import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/hooks/use-online-status"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-warning-bg text-warning flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium">
      <WifiOff className="size-3.5" />
      Sem conexão — você pode consultar dados recentes, mas alterações só salvam quando a internet voltar.
    </div>
  )
}
