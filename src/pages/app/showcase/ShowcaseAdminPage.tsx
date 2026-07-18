import { BadgeCheck, ExternalLink, Pencil, Plus, Store } from "lucide-react"
import { toast } from "sonner"

import { ResaleDeviceFormDialog } from "@/components/app/Showcase/ResaleDeviceFormDialog"
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
  useResaleDevicePhotoUrls,
  useResaleDevices,
  useShowcaseSettings,
  useUpsertShowcaseSettings,
} from "@/hooks/queries/use-showcase"
import { RESALE_CONDITION_LABELS } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** Own component (not inlined in .map()) so the photo-signing hook has a stable per-device call site. */
function DevicePhoto({ resaleDeviceId, alt }: { resaleDeviceId: string; alt: string }) {
  const { data: photoUrls } = useResaleDevicePhotoUrls(resaleDeviceId)
  const firstPhoto = photoUrls?.[0]

  if (!firstPhoto) return <div className="bg-muted aspect-square rounded-xl" />
  return <img src={firstPhoto} alt={alt} className="aspect-square w-full rounded-xl object-cover" />
}

function ShowcaseAdminPage() {
  const { company } = useAuth()
  const { data: devices, isLoading } = useResaleDevices()
  const { data: settings } = useShowcaseSettings()
  const upsertSettings = useUpsertShowcaseSettings()

  const publicUrl = company ? `${window.location.origin}/showcase/${company.slug}` : ""

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vitrine"
        description="Seu catálogo de seminovos, aberto 24h."
        actions={
          <ResaleDeviceFormDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Novo aparelho
              </Button>
            }
          />
        }
      />

      <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">Vitrine pública</p>
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
                  toast.info("Ative a vitrine pública primeiro")
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : !devices || devices.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhum aparelho cadastrado"
          description="Cadastre seminovos e lacrados pra vender direto pela vitrine pública."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {devices.map((device) => (
            <div key={device.id} className="border-border flex flex-col gap-2 rounded-2xl border p-4">
              <DevicePhoto resaleDeviceId={device.id} alt={`${device.brand} ${device.model}`} />
              <p className="text-foreground text-sm font-medium">
                {device.brand} {device.model}
              </p>
              <p className="text-primary text-sm font-bold">{formatCents(device.price_cents)}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge tone="muted">{RESALE_CONDITION_LABELS[device.condition]}</StatusBadge>
                {device.imei && (
                  <StatusBadge tone="success">
                    <BadgeCheck className="size-3" />
                    IMEI
                  </StatusBadge>
                )}
                {device.is_public && <StatusBadge tone="default">Público</StatusBadge>}
              </div>
              <ResaleDeviceFormDialog
                device={device}
                trigger={
                  <Button variant="outline" size="sm" className="mt-1 gap-1.5">
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShowcaseAdminPage
