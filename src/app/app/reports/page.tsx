"use client"

import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/queries/use-clients"
import { useFinancialTransactions } from "@/hooks/queries/use-finance"
import { useInventoryItems } from "@/hooks/queries/use-inventory"
import { useAllClientTotals, useAllSaleItems, useAllServiceOrderItems } from "@/hooks/queries/use-reports"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { useTeamMembers } from "@/hooks/queries/use-team"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_ORDER } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"]
const SLA_TARGET_DAYS = 7

function FinanceiroTab() {
  const { data: transactions } = useFinancialTransactions()
  const { data: saleItems } = useAllSaleItems()
  const { data: serviceItems } = useAllServiceOrderItems()

  const stats = useMemo(() => {
    const all = transactions ?? []
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000)

    const current = all.filter((t) => new Date(t.occurred_on) >= thirtyDaysAgo)
    const previous = all.filter((t) => new Date(t.occurred_on) >= sixtyDaysAgo && new Date(t.occurred_on) < thirtyDaysAgo)

    function totals(list: typeof all) {
      const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount_cents, 0)
      const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount_cents, 0)
      return { income, expense, profit: income - expense }
    }

    const cur = totals(current)
    const prev = totals(previous)
    const pctChange = (a: number, b: number) => (b === 0 ? 0 : Math.round(((a - b) / Math.abs(b)) * 100))

    const byDay = new Map<string, { income: number; expense: number }>()
    for (const t of current) {
      const day = t.occurred_on
      const entry = byDay.get(day) ?? { income: 0, expense: 0 }
      if (t.type === "income") entry.income += t.amount_cents
      else entry.expense += t.amount_cents
      byDay.set(day, entry)
    }
    const dailySeries = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day: day.slice(5), receita: v.income / 100, despesa: v.expense / 100 }))

    const servicesRevenue = (serviceItems ?? []).reduce((s, i) => s + i.total_cents, 0)
    const salesRevenue = (saleItems ?? []).reduce((s, i) => s + i.total_cents, 0)
    const otherRevenue = Math.max(cur.income - servicesRevenue - salesRevenue, 0)

    return {
      cur,
      revenueChange: pctChange(cur.income, prev.income),
      expenseChange: pctChange(cur.expense, prev.expense),
      profitChange: pctChange(cur.profit, prev.profit),
      margin: cur.income > 0 ? Math.round((cur.profit / cur.income) * 100) : 0,
      dailySeries,
      revenueBySource: [
        { name: "Serviços", value: servicesRevenue / 100 },
        { name: "Vendas", value: salesRevenue / 100 },
        { name: "Outros", value: otherRevenue / 100 },
      ].filter((s) => s.value > 0),
    }
  }, [transactions, saleItems, serviceItems])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita Total (30d)" value={formatCents(stats.cur.income)} tone="success" />
        <StatCard label="Despesas (30d)" value={formatCents(stats.cur.expense)} tone="warning" />
        <StatCard label="Lucro Líquido" value={formatCents(stats.cur.profit)} tone={stats.cur.profit >= 0 ? "success" : "destructive"} />
        <StatCard label="Margem de Lucro" value={`${stats.margin}%`} />
      </div>

      {stats.dailySeries.length > 1 && (
        <div className="border-border h-64 rounded-2xl border p-4">
          <p className="text-foreground mb-2 text-sm font-semibold">Receita vs Despesas por Dia</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={stats.dailySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="receita" stroke="var(--color-success)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="despesa" stroke="var(--color-destructive)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.revenueBySource.length > 0 && (
        <div className="border-border h-64 rounded-2xl border p-4">
          <p className="text-foreground mb-2 text-sm font-semibold">Origem da Receita</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={stats.revenueBySource} dataKey="value" nameKey="name" outerRadius={80} label>
                {stats.revenueBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCents(Number(value) * 100)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function OsTab() {
  const { data: serviceOrders, isLoading } = useServiceOrders()

  const stats = useMemo(() => {
    const all = (serviceOrders ?? []).filter((o) => o.status !== "cancelled")
    const delivered = all.filter((o) => o.status === "delivered" && o.delivered_at)

    const durations = delivered.map((o) => (new Date(o.delivered_at!).getTime() - new Date(o.created_at).getTime()) / 86_400_000)
    const avgDays = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0
    const withinSla = durations.filter((d) => d <= SLA_TARGET_DAYS).length

    const buckets = { "<1 dia": 0, "1-3 dias": 0, "3-7 dias": 0, ">7 dias": 0 }
    for (const d of durations) {
      if (d < 1) buckets["<1 dia"]++
      else if (d <= 3) buckets["1-3 dias"]++
      else if (d <= 7) buckets["3-7 dias"]++
      else buckets[">7 dias"]++
    }

    const funnel = SERVICE_ORDER_STATUS_ORDER.map((status) => ({
      status: SERVICE_ORDER_STATUS_LABELS[status],
      count: all.filter((o) => o.status === status).length,
    }))

    return {
      total: all.length,
      avgTicket: all.length > 0 ? all.reduce((s, o) => s + o.total_cents, 0) / all.length : 0,
      slaPercent: durations.length > 0 ? Math.round((withinSla / durations.length) * 100) : 0,
      slaLabel: `${withinSla} de ${durations.length} entregues`,
      avgDays,
      buckets,
      funnel,
    }
  }, [serviceOrders])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de OS" value={String(stats.total)} />
        <StatCard label="Ticket Médio" value={formatCents(stats.avgTicket)} />
        <StatCard label="SLA" value={`${stats.slaPercent}%`} tone={stats.slaPercent >= 80 ? "success" : "warning"} />
        <StatCard label="Tempo Médio" value={`${stats.avgDays.toFixed(1)} dias`} />
      </div>
      <p className="text-muted-foreground text-xs">SLA: entregue em até {SLA_TARGET_DAYS} dias — {stats.slaLabel}</p>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Funil de Operação</p>
        <div className="flex flex-col gap-2">
          {stats.funnel.map((f) => (
            <div key={f.status} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-36 shrink-0">{f.status}</span>
              <div className="bg-muted h-2 flex-1 rounded-full">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (f.count / stats.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-foreground w-8 text-right font-medium">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Tempo de Reparo</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(stats.buckets).map(([label, count]) => (
            <StatCard key={label} label={label} value={String(count)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProdutosTab() {
  const { data: inventoryItems } = useInventoryItems()
  const { data: saleItems } = useAllSaleItems()
  const { data: serviceItems } = useAllServiceOrderItems()

  const stats = useMemo(() => {
    const items = inventoryItems ?? []
    const costById = new Map(items.map((i) => [i.id, i.cost_cents]))
    const nameById = new Map(items.map((i) => [i.id, i.name]))

    const allProductLines = [...(saleItems ?? []), ...(serviceItems ?? [])]
    const revenueCents = allProductLines.reduce((s, l) => s + l.total_cents, 0)
    const costCents = allProductLines.reduce(
      (s, l) => s + (l.inventory_item_id ? (costById.get(l.inventory_item_id) ?? 0) * l.quantity : 0),
      0
    )
    const marginPercent = revenueCents > 0 ? Math.round(((revenueCents - costCents) / revenueCents) * 100) : 0

    const lowStock = items.filter((i) => i.quantity <= i.min_quantity_alert)
    const totalStockQty = items.reduce((s, i) => s + i.quantity, 0)
    const soldQty = allProductLines.reduce((s, l) => s + (l.inventory_item_id ? l.quantity : 0), 0)
    const turnover = totalStockQty > 0 ? soldQty / totalStockQty : 0

    const revenueByDescription = new Map<string, number>()
    for (const line of allProductLines) {
      const key = line.inventory_item_id ? (nameById.get(line.inventory_item_id) ?? line.description) : line.description
      revenueByDescription.set(key, (revenueByDescription.get(key) ?? 0) + line.total_cents)
    }
    const ranked = Array.from(revenueByDescription.entries()).sort(([, a], [, b]) => b - a)

    const totalRanked = ranked.reduce((s, [, v]) => s + v, 0)
    let cumulative = 0
    const abc = { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } }
    for (const [, value] of ranked) {
      cumulative += value
      const pct = totalRanked > 0 ? cumulative / totalRanked : 0
      const bucket = pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C"
      abc[bucket].count++
      abc[bucket].value += value
    }

    return {
      revenueCents,
      marginPercent,
      turnover,
      lowStockCount: lowStock.length,
      top5: ranked.slice(0, 5),
      abc,
    }
  }, [inventoryItems, saleItems, serviceItems])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita de Vendas" value={formatCents(stats.revenueCents)} tone="success" />
        <StatCard label="Margem Média" value={`${stats.marginPercent}%`} />
        <StatCard label="Giro de Estoque" value={stats.turnover.toFixed(2)} />
        <StatCard label="Estoque Baixo" value={String(stats.lowStockCount)} tone="warning" />
      </div>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Curva ABC de Receita</p>
        <div className="grid grid-cols-3 gap-3">
          {(["A", "B", "C"] as const).map((bucket) => (
            <div key={bucket} className="border-border rounded-xl border p-3 text-center">
              <p className="text-foreground text-lg font-bold">{bucket}</p>
              <p className="text-muted-foreground text-xs">{stats.abc[bucket].count} itens</p>
              <p className="text-foreground text-sm font-semibold">{formatCents(stats.abc[bucket].value)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Top 5 Produtos/Serviços Vendidos</p>
        {stats.top5.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem dados ainda.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {stats.top5.map(([name, cents]) => (
              <div key={name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{name}</span>
                <span className="text-foreground font-semibold">{formatCents(cents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientesTab() {
  const { data: clients } = useClients()
  const { data: clientTotals } = useAllClientTotals()
  const { data: serviceOrders } = useServiceOrders()

  const stats = useMemo(() => {
    const totals = clientTotals ?? []
    const ninetyDaysAgo = Date.now() - 90 * 86_400_000
    const thirtyDaysAgo = Date.now() - 30 * 86_400_000

    const active = totals.filter((t) => t.last_service_at && new Date(t.last_service_at).getTime() >= ninetyDaysAgo)
    const newClients = (clients ?? []).filter((c) => new Date(c.created_at).getTime() >= thirtyDaysAgo)

    const withSpend = totals.filter((t) => t.total_spent_cents > 0)
    const avgTicket = withSpend.length > 0 ? withSpend.reduce((s, t) => s + t.total_spent_cents, 0) / withSpend.length : 0

    const orderCountByClient = new Map<string, number>()
    for (const order of serviceOrders ?? []) {
      if (!order.client_id) continue
      orderCountByClient.set(order.client_id, (orderCountByClient.get(order.client_id) ?? 0) + 1)
    }
    const recurring = withSpend.filter((t) => (orderCountByClient.get(t.client_id) ?? 0) > 1)
    const retentionPercent = withSpend.length > 0 ? Math.round((recurring.length / withSpend.length) * 100) : 0

    const sortedBySpend = [...withSpend].sort((a, b) => b.total_spent_cents - a.total_spent_cents)
    const totalRevenue = sortedBySpend.reduce((s, t) => s + t.total_spent_cents, 0)
    const top10Count = Math.max(1, Math.ceil(sortedBySpend.length * 0.1))
    const top10Revenue = sortedBySpend.slice(0, top10Count).reduce((s, t) => s + t.total_spent_cents, 0)
    const concentrationPercent = totalRevenue > 0 ? Math.round((top10Revenue / totalRevenue) * 100) : 0

    const atRisk = withSpend.filter((t) => t.last_service_at && new Date(t.last_service_at).getTime() < ninetyDaysAgo)
    const churnPercent = withSpend.length > 0 ? Math.round((atRisk.length / withSpend.length) * 100) : 0

    const rfm = { champions: 0, loyal: 0, atRisk: 0, hibernating: 0 }
    for (const t of withSpend) {
      const daysSince = t.last_service_at ? (Date.now() - new Date(t.last_service_at).getTime()) / 86_400_000 : 9999
      const frequency = orderCountByClient.get(t.client_id) ?? 0
      if (daysSince <= 30 && frequency >= 2) rfm.champions++
      else if (daysSince <= 90 && frequency >= 1) rfm.loyal++
      else if (daysSince <= 180) rfm.atRisk++
      else rfm.hibernating++
    }

    const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.full_name]))

    return {
      activeCount: active.length,
      newCount: newClients.length,
      avgTicket,
      retentionPercent,
      concentrationPercent,
      churnPercent,
      rfm,
      topClients: sortedBySpend.slice(0, 5).map((t) => ({ name: clientNameById.get(t.client_id) ?? "Cliente", ...t })),
      atRiskClients: atRisk.slice(0, 5).map((t) => ({ name: clientNameById.get(t.client_id) ?? "Cliente", ...t })),
    }
  }, [clients, clientTotals, serviceOrders])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes Ativos" value={String(stats.activeCount)} tone="success" />
        <StatCard label="Ticket Médio Global" value={formatCents(stats.avgTicket)} />
        <StatCard label="Taxa de Retenção" value={`${stats.retentionPercent}%`} />
        <StatCard label="Concentração (Top 10%)" value={`${stats.concentrationPercent}%`} />
      </div>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Segmentação RFM</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Campeões" value={String(stats.rfm.champions)} tone="success" />
          <StatCard label="Leais" value={String(stats.rfm.loyal)} />
          <StatCard label="Em Risco" value={String(stats.rfm.atRisk)} tone="warning" />
          <StatCard label="Hibernando" value={String(stats.rfm.hibernating)} tone="destructive" />
        </div>
      </div>

      <div className="border-border rounded-2xl border p-4">
        <p className="text-foreground mb-3 text-sm font-semibold">Top Clientes por Receita</p>
        <div className="flex flex-col divide-y">
          {stats.topClients.map((c) => (
            <div key={c.client_id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground">{c.name}</span>
              <span className="text-foreground font-semibold">{formatCents(c.total_spent_cents)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Clientes em Risco (Churn)</p>
          <StatusBadge tone="warning">Taxa de churn: {stats.churnPercent}%</StatusBadge>
        </div>
        {stats.atRiskClients.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum cliente em risco no momento.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {stats.atRiskClients.map((c) => (
              <div key={c.client_id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{c.name}</span>
                <span className="text-muted-foreground text-xs">
                  Última visita: {c.last_service_at ? new Date(c.last_service_at).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EquipeTab() {
  const { data: teamMembers } = useTeamMembers()
  const { data: serviceOrders } = useServiceOrders()

  const ranking = useMemo(() => {
    const delivered = (serviceOrders ?? []).filter((o) => o.status === "delivered" && o.assigned_to)
    const countByProfile = new Map<string, number>()
    for (const order of delivered) {
      countByProfile.set(order.assigned_to!, (countByProfile.get(order.assigned_to!) ?? 0) + 1)
    }
    return (teamMembers ?? [])
      .map((m) => ({ member: m, count: countByProfile.get(m.id) ?? 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [teamMembers, serviceOrders])

  if (ranking.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sem dados ainda"
        description="Assim que houver OS concluídas atribuídas à equipe, o ranking aparece aqui."
      />
    )
  }

  return (
    <div className="border-border rounded-2xl border p-4">
      <div className="flex flex-col divide-y">
        {ranking.map((r, i) => (
          <div key={r.member.id} className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-6 font-bold">#{i + 1}</span>
              <span className="text-foreground font-medium">{r.member.full_name}</span>
            </div>
            <span className="text-foreground font-semibold">{r.count} OS concluídas</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const EXPORT_BLOCKS = [
  { key: "financial_summary", label: "Resumo Financeiro" },
  { key: "payment_methods", label: "Métodos de Pagamento" },
  { key: "sales_by_category", label: "Vendas por Categoria e Peças Utilizadas" },
  { key: "os_indicators", label: "Indicadores de OS" },
  { key: "clients_risk", label: "Clientes e Risco de Retenção" },
]

function ExportacaoTab() {
  const [selected, setSelected] = useState<string[]>(EXPORT_BLOCKS.map((b) => b.key))
  const { data: transactions } = useFinancialTransactions()

  function toggleBlock(key: string) {
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
  }

  function handleExportCsv() {
    if (!transactions || transactions.length === 0) {
      toast.error("Nenhum dado pra exportar ainda")
      return
    }
    const rows = [
      ["Data", "Tipo", "Categoria", "Forma de Pagamento", "Valor (R$)"],
      ...transactions.map((t) => [
        t.occurred_on,
        t.type === "income" ? "Receita" : "Despesa",
        t.category,
        t.payment_method ?? "",
        (t.amount_cents / 100).toFixed(2),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bancada-relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exportado")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-foreground text-sm font-semibold">
          Blocos de dados ({selected.length} de {EXPORT_BLOCKS.length} selecionados)
        </p>
        <div className="flex flex-col gap-2">
          {EXPORT_BLOCKS.map((block) => (
            <label key={block.key} className="border-border flex items-center gap-2 rounded-lg border p-2.5 text-sm">
              <Checkbox checked={selected.includes(block.key)} onCheckedChange={() => toggleBlock(block.key)} />
              {block.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => toast.info("Exportação em PDF entra numa fase futura (precisa de um serviço de renderização).")}
        >
          <FileText className="size-4" />
          Gerar Relatório em PDF
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => toast.info("Exportação em XLSX entra numa fase futura.")}
        >
          <FileSpreadsheet className="size-4" />
          Exportar para Excel (XLSX)
        </Button>
        <Button className="gap-2" onClick={handleExportCsv}>
          <Download className="size-4" />
          Exportar para CSV
        </Button>
      </div>
    </div>
  )
}

function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Relatórios" description="Inteligência do negócio — financeiro, operação, produtos e clientes." />

      <Tabs defaultValue="financial">
        <TabsList className="flex-wrap">
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="os">OS</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="export">Exportação</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="mt-4">
          <FinanceiroTab />
        </TabsContent>
        <TabsContent value="os" className="mt-4">
          <OsTab />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <ProdutosTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-4">
          <ClientesTab />
        </TabsContent>
        <TabsContent value="team" className="mt-4">
          <EquipeTab />
        </TabsContent>
        <TabsContent value="export" className="mt-4">
          <ExportacaoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="reports">
      <ReportsPage />
    </ModuleGate>
  )
}
