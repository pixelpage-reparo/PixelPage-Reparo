"use client"

import { CircleDollarSign, ListChecks, PiggyBank, Wallet } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import { ModuleGate } from "@/components/app/ModuleGate"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useClients } from "@/hooks/queries/use-clients"
import { useDashboardSummary } from "@/hooks/queries/use-dashboard"
import { useQuotes } from "@/hooks/queries/use-quotes"
import { useRecurringExpenseRules } from "@/hooks/queries/use-recurring-expenses"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE, SERVICE_ORDER_LANES } from "@/lib/constants"
import { daysUntilNextBirthday } from "@/lib/utils"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function RecentQuotesBlock() {
  const { data: clients } = useClients()
  const { data: quotes, isLoading } = useQuotes()

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients ?? []) map.set(c.id, c.full_name)
    return map
  }, [clients])

  const recent = (quotes ?? []).slice(0, 5)
  const awaitingCount = (quotes ?? []).filter((q) => q.status === "pendente" || q.status === "enviado").length

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm font-semibold">Orçamentos Recentes</p>
        <Link href="/app/quotes" className="text-primary text-xs font-medium hover:underline">
          Ver Todos
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : recent.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum orçamento recente.</p>
      ) : (
        <div className="flex flex-col divide-y">
          {recent.map((quote) => (
            <Link
              key={quote.id}
              href={`/app/quotes/${quote.id}`}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground truncate font-medium">
                  #{quote.quote_number} · {quote.client_id ? (clientsById.get(quote.client_id) ?? "Cliente") : "Sem cliente"}
                </p>
                <p className="text-muted-foreground text-xs">{formatCents(quote.total_cents)}</p>
              </div>
              <StatusBadge tone={QUOTE_STATUS_TONE[quote.status]}>{QUOTE_STATUS_LABELS[quote.status]}</StatusBadge>
            </Link>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">{awaitingCount} propostas aguardando resposta.</p>
    </div>
  )
}

const ACTIVE_STATUSES_FOR_RECEIVABLES = ["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_repair", "ready_for_pickup"]

function ReceivablesTab() {
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const { data: clients } = useClients()

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients ?? []) map.set(c.id, c.full_name)
    return map
  }, [clients])

  const receivable = (serviceOrders ?? [])
    .filter((o) => ACTIVE_STATUSES_FOR_RECEIVABLES.includes(o.status) && o.total_cents > 0)
    .slice(0, 6)

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />
  if (receivable.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">Tudo em dia! Nenhum recebimento pendente.</p>
  }

  return (
    <div className="flex flex-col divide-y">
      {receivable.map((order) => (
        <div key={order.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <p className="text-foreground font-medium">
              OS #{order.os_number} · {order.client_id ? (clientsById.get(order.client_id) ?? "Cliente") : "Sem cliente"}
            </p>
          </div>
          <span className="text-foreground font-semibold">{formatCents(order.total_cents)}</span>
        </div>
      ))}
    </div>
  )
}

function PayablesTab() {
  const { data: rules, isLoading } = useRecurringExpenseRules()
  const active = (rules ?? []).filter((r) => r.is_active)

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />
  if (active.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">Nenhuma despesa fixa pendente.</p>
  }

  return (
    <div className="flex flex-col divide-y">
      {active.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <p className="text-foreground font-medium">{rule.description}</p>
            <p className="text-muted-foreground text-xs">
              {rule.frequency === "monthly" ? `Todo dia ${rule.day_of_month}` : "Semanal"}
            </p>
          </div>
          <span className="text-foreground font-semibold">{formatCents(rule.amount_cents)}</span>
        </div>
      ))}
    </div>
  )
}

function BirthdaysTab() {
  const { data: clients, isLoading } = useClients()

  const withBirthdays = useMemo(() => {
    return (clients ?? [])
      .filter((c) => c.birth_date)
      .map((c) => ({ client: c, daysUntil: daysUntilNextBirthday(c.birth_date!) }))
      .filter((c) => c.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 6)
  }, [clients])

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />
  if (withBirthdays.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">Nenhum aniversário nos próximos 30 dias.</p>
  }

  return (
    <div className="flex flex-col divide-y">
      {withBirthdays.map(({ client, daysUntil }) => (
        <div key={client.id} className="flex items-center justify-between py-2 text-sm">
          <p className="text-foreground font-medium">{client.full_name}</p>
          <StatusBadge tone={daysUntil === 0 ? "success" : "muted"}>
            {daysUntil === 0 ? "Hoje!" : `em ${daysUntil} dias`}
          </StatusBadge>
        </div>
      ))}
    </div>
  )
}

function RemindersBlock() {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
      <p className="text-foreground text-sm font-semibold">Lembretes e Pendências</p>
      <Tabs defaultValue="receivable">
        <TabsList>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
          <TabsTrigger value="birthdays">Aniversários</TabsTrigger>
        </TabsList>
        <TabsContent value="receivable" className="mt-3">
          <ReceivablesTab />
        </TabsContent>
        <TabsContent value="payable" className="mt-3">
          <PayablesTab />
        </TabsContent>
        <TabsContent value="birthdays" className="mt-3">
          <BirthdaysTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardPage() {
  const { company } = useAuth()
  const { data: summary, isLoading } = useDashboardSummary()

  const dailyGoalCents = company?.daily_goal_cents ?? 0
  const todayRevenueCents = summary?.todayRevenueCents ?? 0
  const goalProgress = dailyGoalCents > 0 ? Math.min(100, Math.round((todayRevenueCents / dailyGoalCents) * 100)) : 0

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" description="Visão geral do dia na sua bancada." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Visão geral do dia na sua bancada." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Faturamento hoje"
          value={formatCents(todayRevenueCents)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Margem do dia"
          value={`${summary?.marginPercent ?? 0}%`}
          icon={PiggyBank}
          tone={(summary?.marginPercent ?? 0) >= 0 ? "success" : "warning"}
        />
        <StatCard label="Saídas hoje" value={formatCents(summary?.todayExpenseCents ?? 0)} icon={CircleDollarSign} tone="warning" />
        <StatCard label="OS em aberto" value={String(summary?.openOrdersCount ?? 0)} icon={ListChecks} />
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-semibold">Meta do dia</span>
          <span className="text-muted-foreground">{goalProgress}%</span>
        </div>
        <Progress value={goalProgress} className="mt-3" />
        {dailyGoalCents === 0 && (
          <p className="text-muted-foreground mt-2 text-xs">
            Defina uma meta diária nas configurações da empresa pra acompanhar o progresso.
          </p>
        )}
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-foreground mb-4 text-sm font-semibold">Mesa/Fluxo</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_ORDER_LANES.map((lane) => {
            const count = lane.statuses.reduce((sum, status) => sum + (summary?.statusCounts[status] ?? 0), 0)
            return (
              <StatusBadge key={lane.key} tone="muted">
                {lane.label} · {count}
              </StatusBadge>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentQuotesBlock />
        <RemindersBlock />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="dashboard">
      <DashboardPage />
    </ModuleGate>
  )
}
