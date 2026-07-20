"use client"

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Archive, Plus, Search, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { KanbanBoard } from "@/components/app/Kanban/KanbanBoard"
import { KanbanCard } from "@/components/app/Kanban/KanbanCard"
import { KanbanColumn } from "@/components/app/Kanban/KanbanColumn"
import { ModuleGate } from "@/components/app/ModuleGate"
import { StatusSelect } from "@/components/app/ServiceOrders/StatusSelect"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useClients } from "@/hooks/queries/use-clients"
import { useServiceOrders, useUpdateServiceOrderStatus } from "@/hooks/queries/use-service-orders"
import { SERVICE_ORDER_LANES as LANES } from "@/lib/constants"
import { cn } from "@/lib/utils"

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        position: "relative" as const,
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")} {...listeners} {...attributes}>
      {children}
    </div>
  )
}

function DroppableLane({ laneKey, children }: { laneKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: laneKey })
  return (
    <div ref={setNodeRef} className={cn("flex flex-1 flex-col gap-2 rounded-xl", isOver && "bg-primary/5 ring-primary/40 ring-2")}>
      {children}
    </div>
  )
}

function MesaFluxoPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const { data: clients } = useClients()
  const updateStatus = useUpdateServiceOrderStatus()

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients ?? []) map.set(client.id, client.full_name)
    return map
  }, [clients])

  const filteredOrders = useMemo(() => {
    return (serviceOrders ?? []).filter((order) => {
      if (!showArchived && order.status === "cancelled") return false
      if (showArchived && order.status !== "cancelled") return false
      if (!search.trim()) return true
      const clientName = order.client_id ? (clientsById.get(order.client_id) ?? "") : ""
      const term = search.trim().toLowerCase()
      return (
        String(order.os_number).includes(term) ||
        clientName.toLowerCase().includes(term) ||
        (order.reported_issue ?? "").toLowerCase().includes(term)
      )
    })
  }, [serviceOrders, showArchived, search, clientsById])

  const ordersByLane = useMemo(() => {
    const grouped = new Map<string, typeof filteredOrders>()
    for (const lane of LANES) grouped.set(lane.key, [])
    for (const order of filteredOrders) {
      const lane = LANES.find((l) => l.statuses.includes(order.status))
      if (lane) grouped.get(lane.key)?.push(order)
    }
    return grouped
  }, [filteredOrders])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const orderId = String(active.id)
    const laneKey = String(over.id)
    const lane = LANES.find((l) => l.key === laneKey)
    const order = (serviceOrders ?? []).find((o) => o.id === orderId)
    if (!lane || !order) return
    if (lane.statuses.includes(order.status)) return // dropped back in its own lane

    updateStatus.mutate(
      { id: orderId, status: lane.dropStatus },
      {
        onError: (error) =>
          toast.error("Não foi possível mover a OS", {
            description: error instanceof Error ? error.message : "Tente novamente.",
          }),
      }
    )
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Mesa/Fluxo"
        description="Arraste os cards pra avançar o reparo — ou use o seletor de status a qualquer momento."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowArchived((v) => !v)}
            >
              <Archive className="size-4" />
              {showArchived ? "Ver ativas" : "Ver arquivadas"}
            </Button>
            <Button className="gap-2" onClick={() => router.push("/app/service-orders/new")}>
              <Plus className="size-4" />
              Nova OS
            </Button>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Buscar por OS, cliente ou defeito..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={showArchived ? "Nenhuma OS arquivada" : "Nenhuma OS encontrada"}
          description={showArchived ? "OS canceladas aparecem aqui." : "Ajuste a busca ou crie uma nova OS."}
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <KanbanBoard>
            {LANES.map((lane) => {
              const orders = ordersByLane.get(lane.key) ?? []
              return (
                <KanbanColumn key={lane.key} title={lane.label} count={orders.length} accentClassName={lane.accent}>
                  <DroppableLane laneKey={lane.key}>
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground px-1 py-6 text-center text-xs">Nenhuma OS encontrada</p>
                    ) : (
                      orders.map((order) => (
                        <DraggableCard key={order.id} id={order.id}>
                          <KanbanCard onClick={() => router.push(`/app/service-orders/${order.id}`)}>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-xs font-medium">#{order.os_number}</span>
                            </div>
                            <p className="text-foreground truncate text-sm font-medium">
                              {order.client_id ? (clientsById.get(order.client_id) ?? "Cliente") : "Sem cliente"}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {order.reported_issue || "Sem descrição"}
                            </p>
                            <div onClick={(e) => e.stopPropagation()}>
                              <StatusSelect
                                value={order.status}
                                onChange={(status) => updateStatus.mutate({ id: order.id, status })}
                              />
                            </div>
                          </KanbanCard>
                        </DraggableCard>
                      ))
                    )}
                  </DroppableLane>
                </KanbanColumn>
              )
            })}
          </KanbanBoard>
        </DndContext>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="mesa_fluxo">
      <MesaFluxoPage />
    </ModuleGate>
  )
}
