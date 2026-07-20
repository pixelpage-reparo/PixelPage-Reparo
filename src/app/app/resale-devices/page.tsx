"use client"

import { BadgeCheck, Handshake, Pencil, Plus, ShoppingCart, Smartphone, Store } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { ResaleDeviceFormDialog } from "@/components/app/Showcase/ResaleDeviceFormDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useResaleDevicePhotoUrls, useResaleDevices } from "@/hooks/queries/use-showcase"
import { RESALE_CONDITION_LABELS } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function DevicePhoto({ resaleDeviceId, alt }: { resaleDeviceId: string; alt: string }) {
  const { data: photoUrls } = useResaleDevicePhotoUrls(resaleDeviceId)
  const firstPhoto = photoUrls?.[0]
  if (!firstPhoto) return <div className="bg-muted aspect-square rounded-xl" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={firstPhoto} alt={alt} className="aspect-square w-full rounded-xl object-cover" />
}

function DeviceGrid({ devices }: { devices: NonNullable<ReturnType<typeof useResaleDevices>["data"]> }) {
  if (devices.length === 0) {
    return (
      <EmptyState
        icon={Smartphone}
        title="Nenhum aparelho aqui"
        description="Cadastre um aparelho pra começar a controlar seminovos e lacrados."
      />
    )
  }

  return (
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
            {device.is_public && <StatusBadge tone="default">Anunciado</StatusBadge>}
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
  )
}

function ResaleDevicesPage() {
  const router = useRouter()
  const { data: devices, isLoading } = useResaleDevices()
  const [tab, setTab] = useState("overview")

  const stats = useMemo(() => {
    const all = devices ?? []
    const inStock = all.filter((d) => d.status !== "sold")
    const announced = all.filter((d) => d.is_public && d.status === "available")
    const reserved = all.filter((d) => d.status === "reserved")
    const soldThisMonth = all.filter((d) => {
      if (d.status !== "sold") return false
      const updated = new Date(d.updated_at)
      const now = new Date()
      return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
    })

    return {
      inStockCount: inStock.length,
      inStockCostCents: inStock.reduce((sum, d) => sum + d.cost_cents + d.repair_cost_cents, 0),
      announcedCount: announced.length,
      announcedRevenueCents: announced.reduce((sum, d) => sum + d.price_cents, 0),
      reservedCount: reserved.length,
      soldCount: soldThisMonth.length,
      soldProfitCents: soldThisMonth.reduce(
        (sum, d) => sum + (d.price_cents - d.cost_cents - d.repair_cost_cents),
        0
      ),
    }
  }, [devices])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aparelhos"
        description="Seminovos, lacrados e usados: do cadastro à venda com lucro real."
        actions={
          <Button className="gap-2" onClick={() => router.push("/app/resale-devices/new")}>
            <Plus className="size-4" />
            Cadastrar Aparelho
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="devices">Aparelhos</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
          <TabsTrigger value="warranties">Garantias</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Em Estoque" value={String(stats.inStockCount)} tone="default" />
              <StatCard label="Anunciados" value={String(stats.announcedCount)} tone="success" />
              <StatCard label="Reservados" value={String(stats.reservedCount)} tone="warning" />
              <StatCard label="Vendidos no Mês" value={String(stats.soldCount)} tone="success" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push("/app/resale-devices/new")}>
              <Plus className="size-5" />
              <span className="text-xs">Cadastrar Aparelho</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => toast.info("Comprar de Cliente entra numa fase futura — vai gerar recibo e checklist automaticamente.")}
            >
              <Handshake className="size-5" />
              <span className="text-xs">Comprar de Cliente</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push("/app/pos")}>
              <ShoppingCart className="size-5" />
              <span className="text-xs">Abrir PDV</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push("/app/showcase")}>
              <Store className="size-5" />
              <span className="text-xs">Vitrine Online</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <DeviceGrid devices={devices ?? []} />
          )}
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <EmptyState
            icon={Handshake}
            title="Compras — em breve"
            description="O fluxo de 'Comprar de Cliente' (recibo + checklist automáticos) entra numa fase futura."
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <DeviceGrid devices={(devices ?? []).slice().sort((a, b) => a.price_cents - b.price_cents)} />
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <DeviceGrid devices={(devices ?? []).filter((d) => d.status === "reserved")} />
        </TabsContent>

        <TabsContent value="warranties" className="mt-4">
          <EmptyState
            icon={BadgeCheck}
            title="Garantias — em breve"
            description="O rastreamento de garantia por aparelho vendido entra numa fase futura."
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Custo parado em estoque" value={formatCents(stats.inStockCostCents)} tone="warning" />
            <StatCard label="Lucro do mês" value={formatCents(stats.soldProfitCents)} tone="success" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="resale_devices">
      <ResaleDevicesPage />
    </ModuleGate>
  )
}
