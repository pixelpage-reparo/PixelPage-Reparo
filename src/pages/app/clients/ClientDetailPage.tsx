import { Pencil, Smartphone, Wrench } from "lucide-react"
import { useMemo } from "react"
import { useParams } from "react-router-dom"

import { ClientFormDialog } from "@/components/app/Clients/ClientFormDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useClient, useClientDevices, useClientTotals } from "@/hooks/queries/use-clients"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_TONE } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useClient(id)
  const { data: devices } = useClientDevices(id)
  const { data: totals } = useClientTotals(id)
  const { data: allServiceOrders } = useServiceOrders()

  const clientOrders = useMemo(
    () => (allServiceOrders ?? []).filter((order) => order.client_id === id),
    [allServiceOrders, id]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (!client) {
    return <EmptyState icon={Wrench} title="Cliente não encontrado" description="Ele pode ter sido removido." />
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={client.full_name}
        description={client.phone}
        actions={
          <ClientFormDialog
            client={client}
            trigger={
              <Button variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
                Editar
              </Button>
            }
          />
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total gasto" value={formatCents(totals?.total_spent_cents ?? 0)} tone="success" />
        <StatCard
          label="Última visita"
          value={
            totals?.last_service_at
              ? new Date(totals.last_service_at).toLocaleDateString("pt-BR")
              : "—"
          }
        />
      </div>

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="size-4" />
          Aparelhos
        </p>
        {!devices || devices.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum aparelho registrado ainda.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {devices.map((device) => (
              <div key={device.id} className="py-2 text-sm">
                <p className="text-foreground font-medium">
                  {device.brand} {device.model}
                </p>
                {device.serial_or_imei && (
                  <p className="text-muted-foreground text-xs">IMEI: {device.serial_or_imei}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Wrench className="size-4" />
          Histórico de OS
        </p>
        {clientOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma OS registrada ainda.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {clientOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-foreground font-medium">OS #{order.os_number}</p>
                  <p className="text-muted-foreground text-xs">{order.reported_issue}</p>
                </div>
                <StatusBadge tone={SERVICE_ORDER_STATUS_TONE[order.status]}>
                  {SERVICE_ORDER_STATUS_LABELS[order.status]}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetailPage
