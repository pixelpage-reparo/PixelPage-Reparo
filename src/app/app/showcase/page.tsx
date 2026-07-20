"use client"

import { ExternalLink, Store } from "lucide-react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import {
  useResaleDevices,
  useShowcaseSettings,
  useUpdateResaleDevice,
  useUpsertShowcaseSettings,
} from "@/hooks/queries/use-showcase"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/**
 * Narrowed to storefront settings + which already-cataloged devices are
 * public — device CRUD itself moved to the Aparelhos module
 * (/app/resale-devices). This mirrors the spec's split: Aparelhos owns the
 * inventory, Vitrine Online owns the public storefront config.
 */
function ShowcaseAdminPage() {
  const { company } = useAuth()
  const { data: devices, isLoading } = useResaleDevices()
  const { data: settings } = useShowcaseSettings()
  const upsertSettings = useUpsertShowcaseSettings()
  const updateDevice = useUpdateResaleDevice()

  const publicUrl = company ? `${window.location.origin}/showcase/${company.slug}` : ""
  const visibleCount = (devices ?? []).filter((d) => d.is_public).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Vitrine Online" description="Seu catálogo de seminovos, aberto 24h." />

      <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">Link Público</p>
            <p className="text-muted-foreground text-xs">
              {settings?.is_enabled ? "Ativa" : "Desativada"} — {publicUrl}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings?.is_enabled ?? false}
              onCheckedChange={(checked) =>
                upsertSettings.mutate({
                  is_enabled: checked,
                  whatsapp_number: settings?.whatsapp_number ?? "",
                  headline: settings?.headline ?? "",
                  show_prices: settings?.show_prices ?? true,
                })
              }
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Abrir vitrine pública"
              onClick={() => {
                if (!settings?.is_enabled) {
                  toast.info("Ative o link público primeiro")
                  return
                }
                window.open(publicUrl, "_blank")
              }}
            >
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="headline">Título da vitrine</Label>
            <Input
              id="headline"
              placeholder="Ex: Seminovos com garantia"
              defaultValue={settings?.headline ?? ""}
              onBlur={(e) =>
                upsertSettings.mutate({
                  is_enabled: settings?.is_enabled ?? false,
                  whatsapp_number: settings?.whatsapp_number ?? "",
                  headline: e.target.value,
                  show_prices: settings?.show_prices ?? true,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp de contato</Label>
            <Input
              id="whatsapp"
              placeholder="(00) 00000-0000"
              defaultValue={settings?.whatsapp_number ?? ""}
              onBlur={(e) =>
                upsertSettings.mutate({
                  is_enabled: settings?.is_enabled ?? false,
                  whatsapp_number: e.target.value,
                  headline: settings?.headline ?? "",
                  show_prices: settings?.show_prices ?? true,
                })
              }
            />
          </div>
        </div>

        <div className="border-border flex items-center justify-between rounded-xl border p-3">
          <span className="text-sm font-medium">Exibir preços na vitrine</span>
          <Switch
            checked={settings?.show_prices ?? true}
            onCheckedChange={(checked) =>
              upsertSettings.mutate({
                is_enabled: settings?.is_enabled ?? false,
                whatsapp_number: settings?.whatsapp_number ?? "",
                headline: settings?.headline ?? "",
                show_prices: checked,
              })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-foreground text-sm font-semibold">Gerenciar Itens ({visibleCount} visíveis)</p>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : !devices || devices.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nenhum aparelho cadastrado"
            description="Cadastre aparelhos no módulo Aparelhos pra depois publicá-los aqui."
          />
        ) : (
          <div className="border-border overflow-hidden rounded-2xl border">
            {devices.map((device) => (
              <div key={device.id} className="border-border flex items-center justify-between border-b p-3 last:border-b-0">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {device.brand} {device.model}
                  </p>
                  <p className="text-muted-foreground text-xs">{formatCents(device.price_cents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {device.status !== "available" && <StatusBadge tone="muted">Indisponível</StatusBadge>}
                  <Switch
                    checked={device.is_public}
                    disabled={device.status !== "available"}
                    onCheckedChange={(checked) => updateDevice.mutate({ id: device.id, is_public: checked })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="showcase">
      <ShowcaseAdminPage />
    </ModuleGate>
  )
}
