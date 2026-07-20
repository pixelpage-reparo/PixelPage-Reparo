"use client"

import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRevealDeviceSecret } from "@/hooks/queries/use-device-secret"

/**
 * Shows/reveals the encrypted device unlock PIN/pattern
 * (device_unlock_secret_encrypted). Rendered only when the order actually
 * has one saved — see the two call sites in service-orders/[id] and
 * quotes/[id]. The "can reveal" check here is UX only (hides a button the
 * person can't use); the real authorization boundary is server-side in
 * /api/device-secret/reveal, which re-checks the same rule independently.
 */
export function DeviceSecretCard({
  orderType,
  orderId,
  assignedTo,
}: {
  orderType: "service_order" | "quote"
  orderId: string
  assignedTo: string | null
}) {
  const { profile } = useAuth()
  const [revealedValue, setRevealedValue] = useState<string | null>(null)
  const reveal = useRevealDeviceSecret()

  const canReveal = profile?.role === "owner" || (!!profile && profile.id === assignedTo)

  async function handleReveal() {
    try {
      const value = await reveal.mutateAsync({ orderType, orderId })
      setRevealedValue(value)
    } catch (error) {
      toast.error("Não foi possível revelar o dado de bloqueio", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="border-border flex flex-col gap-2 rounded-2xl border p-5">
      <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4" />
        Segurança do Dispositivo
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground font-mono text-sm">
          {revealedValue ?? "••••••••"}
        </span>
        {revealedValue ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRevealedValue(null)}>
            <EyeOff className="size-3.5" />
            Ocultar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!canReveal || reveal.isPending}
            onClick={handleReveal}
          >
            <Eye className="size-3.5" />
            {reveal.isPending ? "Revelando..." : "Revelar"}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {canReveal
          ? "Visível só nesta tela — não fica guardado no seu navegador."
          : "Só o técnico atribuído ou o dono da assistência podem revelar esse dado."}
      </p>
    </div>
  )
}
