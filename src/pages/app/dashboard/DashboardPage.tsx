import { CircleDollarSign, ListChecks, PiggyBank, Wallet } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useDashboardSummary } from "@/hooks/queries/use-dashboard"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_ORDER, SERVICE_ORDER_STATUS_TONE } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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
        <p className="text-foreground mb-4 text-sm font-semibold">OS por status</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_ORDER_STATUS_ORDER.map((status) => (
            <StatusBadge key={status} tone={SERVICE_ORDER_STATUS_TONE[status]}>
              {SERVICE_ORDER_STATUS_LABELS[status]} · {summary?.statusCounts[status] ?? 0}
            </StatusBadge>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
