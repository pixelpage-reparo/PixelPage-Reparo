import { Plus } from "lucide-react"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { KanbanBoard } from "@/components/app/Kanban/KanbanBoard"
import { KanbanCard } from "@/components/app/Kanban/KanbanCard"
import { KanbanColumn } from "@/components/app/Kanban/KanbanColumn"
import { StatusSelect } from "@/components/app/ServiceOrders/StatusSelect"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useClients } from "@/hooks/queries/use-clients"
import { useServiceOrders, useUpdateServiceOrderStatus } from "@/hooks/queries/use-service-orders"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_ORDER } from "@/lib/constants"
import type { ServiceOrderStatus } from "@/types/domain"
import { Wrench } from "lucide-react"

const COLUMN_ACCENTS: Record<ServiceOrderStatus, string> = {
  received: "bg-muted-foreground",
  diagnosing: "bg-chart-1",
  awaiting_approval: "bg-warning",
  awaiting_parts: "bg-warning",
  in_repair: "bg-chart-1",
  ready_for_pickup: "bg-success",
  delivered: "bg-success",
  cancelled: "bg-destructive",
}

function ServiceOrdersBoardPage() {
  const navigate = useNavigate()
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const { data: clients } = useClients()
  const updateStatus = useUpdateServiceOrderStatus()

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients ?? []) map.set(client.id, client.full_name)
    return map
  }, [clients])

  const ordersByStatus = useMemo(() => {
    const grouped = new Map<ServiceOrderStatus, typeof serviceOrders>()
    for (const status of SERVICE_ORDER_STATUS_ORDER) grouped.set(status, [])
    for (const order of serviceOrders ?? []) {
      if (order.status === "cancelled") continue
      grouped.get(order.status)?.push(order)
    }
    return grouped
  }, [serviceOrders])

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Ordens de Serviço"
        description="A mesa de reparo, organizada por status."
        actions={
          <Button className="gap-2" onClick={() => navigate("/app/service-orders/new")}>
            <Plus className="size-4" />
            Nova OS
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : !serviceOrders || serviceOrders.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhuma OS ainda"
          description="Crie a primeira ordem de serviço pra começar a organizar sua bancada."
          action={
            <Button className="mt-2 gap-2" onClick={() => navigate("/app/service-orders/new")}>
              <Plus className="size-4" />
              Nova OS
            </Button>
          }
        />
      ) : (
        <KanbanBoard>
          {SERVICE_ORDER_STATUS_ORDER.map((status) => {
            const orders = ordersByStatus.get(status) ?? []
            return (
              <KanbanColumn
                key={status}
                title={SERVICE_ORDER_STATUS_LABELS[status]}
                count={orders.length}
                accentClassName={COLUMN_ACCENTS[status]}
              >
                {orders.map((order) => (
                  <KanbanCard key={order.id} onClick={() => navigate(`/app/service-orders/${order.id}`)}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">#{order.os_number}</span>
                    </div>
                    <p className="text-foreground truncate text-sm font-medium">
                      {order.client_id ? clientsById.get(order.client_id) ?? "Cliente" : "Sem cliente"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {order.reported_issue || "Sem descrição"}
                    </p>
                    <StatusSelect
                      value={order.status}
                      onChange={(status) => updateStatus.mutate({ id: order.id, status })}
                    />
                  </KanbanCard>
                ))}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      )}
    </div>
  )
}

export default ServiceOrdersBoardPage
