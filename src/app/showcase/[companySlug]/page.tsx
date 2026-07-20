"use client"

import { BadgeCheck, MessageCircle, Store } from "lucide-react"
import { useParams } from "next/navigation"

import { EmptyState } from "@/components/shared/EmptyState"
import { Logo } from "@/components/shared/Logo"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePublicResaleDevicePhotoUrls, usePublicShowcase } from "@/hooks/queries/use-showcase"
import { RESALE_CONDITION_LABELS } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** Own component (not inlined in .map()) so the photo-signing hook has a stable per-device call site. */
function DevicePhoto({ resaleDeviceId, alt }: { resaleDeviceId: string; alt: string }) {
  const { data: photoUrls } = usePublicResaleDevicePhotoUrls(resaleDeviceId)
  const firstPhoto = photoUrls?.[0]

  if (!firstPhoto) return <div className="bg-muted aspect-square" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={firstPhoto} alt={alt} className="aspect-square w-full object-cover" />
}

export default function ShowcasePublicPage() {
  const params = useParams<{ companySlug: string }>()
  const companySlug = params.companySlug
  const { data, isLoading, isError } = usePublicShowcase(companySlug)

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data || !data.settings?.is_enabled) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center gap-8 px-4 py-16">
        <Logo size="md" />
        <EmptyState icon={Store} title="Vitrine não encontrada" description="Essa vitrine não está disponível." />
      </div>
    )
  }

  const { company, settings, devices } = data
  const showPrices = settings?.show_prices ?? true

  return (
    <div className="bg-background min-h-svh">
      <header className="border-border border-b px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt={company.name} className="size-9 rounded-lg" />
            ) : (
              <span className="bg-brand-gradient inline-flex size-9 items-center justify-center rounded-lg text-white">
                <Store className="size-4.5" />
              </span>
            )}
            <div>
              <p className="text-foreground text-sm font-bold">{company.name}</p>
              <p className="text-muted-foreground text-xs">{settings?.headline || "Vitrine de seminovos"}</p>
            </div>
          </div>
          {settings?.whatsapp_number && (
            <Button size="sm" className="gap-1.5" asChild>
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        {devices.length === 0 ? (
          <EmptyState icon={Store} title="Nenhum aparelho disponível" description="Volte em breve." />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {devices.map((device) => (
              <div key={device.id} className="border-border overflow-hidden rounded-2xl border">
                <DevicePhoto resaleDeviceId={device.id} alt={`${device.brand} ${device.model}`} />
                <div className="flex flex-col gap-1.5 p-3">
                  <p className="text-foreground text-sm font-semibold">
                    {device.brand} {device.model}
                  </p>
                  {device.storage_capacity && (
                    <p className="text-muted-foreground text-xs">{device.storage_capacity}</p>
                  )}
                  {showPrices && <p className="text-primary text-sm font-bold">{formatCents(device.price_cents)}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge tone="muted">{RESALE_CONDITION_LABELS[device.condition]}</StatusBadge>
                    {device.imei && (
                      <StatusBadge tone="success">
                        <BadgeCheck className="size-3" />
                        IMEI verificado
                      </StatusBadge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
