"use client"

import { Eye, EyeOff, Plus, Search, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/queries/use-clients"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_TONE } from "@/lib/constants"
import type { ServiceOrderStatus } from "@/types/domain"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const IN_PROGRESS_STATUSES: ServiceOrderStatus[] = [
  "received",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_repair",
  "ready_for_pickup",
]

const PAGE_SIZE = 10

type FilterTab = "all" | "in_progress" | "finished" | "interrupted"

function ServiceOrdersListPage() {
  const router = useRouter()
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const { data: clients } = useClients()
  const [tab, setTab] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [showValues, setShowValues] = useState(true)
  const [page, setPage] = useState(1)

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients ?? []) map.set(client.id, client.full_name)
    return map
  }, [clients])

  const kpis = useMemo(() => {
    const orders = serviceOrders ?? []
    const active = orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status))
    const interrupted = orders.filter((o) => o.status === "cancelled")
    const estimatedCents = active.reduce((sum, o) => sum + o.total_cents, 0)

    const finishedWithDuration = orders.filter((o) => o.status === "delivered" && o.delivered_at)
    const avgDays =
      finishedWithDuration.length > 0
        ? finishedWithDuration.reduce((sum, o) => {
            const days = (new Date(o.delivered_at!).getTime() - new Date(o.created_at).getTime()) / 86_400_000
            return sum + Math.max(days, 0)
          }, 0) / finishedWithDuration.length
        : null

    return {
      activeCount: active.length,
      estimatedCents,
      interruptedCount: interrupted.length,
      avgDays,
    }
  }, [serviceOrders])

  const filtered = useMemo(() => {
    let list = serviceOrders ?? []

    if (tab === "in_progress") list = list.filter((o) => IN_PROGRESS_STATUSES.includes(o.status))
    else if (tab === "finished") list = list.filter((o) => o.status === "delivered")
    else if (tab === "interrupted") list = list.filter((o) => o.status === "cancelled")

    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter((o) => {
        const clientName = o.client_id ? (clientsById.get(o.client_id) ?? "") : ""
        return (
          String(o.os_number).includes(term) ||
          clientName.toLowerCase().includes(term) ||
          (o.reported_issue ?? "").toLowerCase().includes(term)
        )
      })
    }

    return list
  }, [serviceOrders, tab, search, clientsById])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleTabChange(value: string) {
    setTab(value as FilterTab)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ordens de Serviço"
        description="Histórico completo, com KPIs e filtros por status."
        actions={
          <Button className="gap-2" onClick={() => router.push("/app/service-orders/new")}>
            <Plus className="size-4" />
            Nova OS
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total em Bancada" value={String(kpis.activeCount)} tone="default" />
        <StatCard
          label="Valor Estimado"
          value={showValues ? formatCents(kpis.estimatedCents) : "••••••"}
          icon={showValues ? Eye : EyeOff}
          tone="success"
        />
        <StatCard label="Total Interrompido" value={String(kpis.interruptedCount)} tone="warning" />
        <StatCard
          label="Tempo Médio em Bancada"
          value={kpis.avgDays === null ? "—" : `${kpis.avgDays.toFixed(1)} dias`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="finished">Finalizadas</TabsTrigger>
            <TabsTrigger value="interrupted">Interrompidas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Cliente, IMEI ou #OS..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowValues((v) => !v)} aria-label="Ocultar valores">
            {showValues ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhuma OS encontrada" description="Ajuste a busca ou os filtros." />
      ) : (
        <>
          <div className="border-border overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/app/service-orders/${order.id}`)}>
                    <TableCell className="font-medium">#{order.os_number}</TableCell>
                    <TableCell>{order.client_id ? (clientsById.get(order.client_id) ?? "—") : "Sem cliente"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-64 truncate">
                      {order.reported_issue || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={SERVICE_ORDER_STATUS_TONE[order.status]}>
                        {SERVICE_ORDER_STATUS_LABELS[order.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {showValues ? formatCents(order.total_cents) : "••••••"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="service_orders">
      <ServiceOrdersListPage />
    </ModuleGate>
  )
}
