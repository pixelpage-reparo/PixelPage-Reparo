"use client"

import { FileText, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
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
import { useQuotes } from "@/hooks/queries/use-quotes"
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE } from "@/lib/constants"
import type { QuoteStatus } from "@/types/domain"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type FilterTab = "all" | QuoteStatus

function QuotesPage() {
  const router = useRouter()
  const { data: quotes, isLoading } = useQuotes()
  const { data: clients } = useClients()
  const [tab, setTab] = useState<FilterTab>("all")

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients ?? []) map.set(client.id, client.full_name)
    return map
  }, [clients])

  const kpis = useMemo(() => {
    const all = quotes ?? []
    const open = all.filter((q) => q.status === "pendente" || q.status === "enviado")
    const approved = all.filter((q) => q.status === "aprovado" || q.status === "convertido")

    return {
      openCount: open.length,
      openTotalCents: open.reduce((sum, q) => sum + q.total_cents, 0),
      conversionRate: all.length > 0 ? Math.round((approved.length / all.length) * 100) : 0,
    }
  }, [quotes])

  const filtered = (quotes ?? []).filter((q) => tab === "all" || q.status === tab)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orçamentos"
        description="Propostas comerciais — aprove pra converter direto em OS."
        actions={
          <Button className="gap-2" onClick={() => router.push("/app/quotes/new")}>
            <Plus className="size-4" />
            Novo Orçamento
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard
          label="Em Aberto (Aguardando)"
          value={formatCents(kpis.openTotalCents)}
          tone="warning"
        />
        <StatCard
          label="Taxa de Conversão"
          value={`${kpis.conversionRate}%`}
          tone={kpis.conversionRate >= 60 ? "success" : "warning"}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendente</TabsTrigger>
          <TabsTrigger value="enviado">Enviado</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovado</TabsTrigger>
          <TabsTrigger value="recusado">Recusado</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento encontrado"
          description="Crie o primeiro orçamento pra começar a converter propostas em OS."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#ID</TableHead>
                <TableHead>Cliente / Aparelho</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((quote) => (
                <TableRow key={quote.id} className="cursor-pointer" onClick={() => router.push(`/app/quotes/${quote.id}`)}>
                  <TableCell className="font-medium">#{quote.quote_number}</TableCell>
                  <TableCell>
                    <p className="text-foreground text-sm font-medium">
                      {quote.client_id ? (clientsById.get(quote.client_id) ?? "—") : "Sem cliente"}
                    </p>
                    <p className="text-muted-foreground text-xs">{quote.device_description || "—"}</p>
                  </TableCell>
                  <TableCell>{formatCents(quote.total_cents)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={QUOTE_STATUS_TONE[quote.status]}>
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="quotes">
      <QuotesPage />
    </ModuleGate>
  )
}
