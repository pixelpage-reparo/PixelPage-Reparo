"use client"

import { Download, Plus, RefreshCw, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { TransactionFormDialog } from "@/components/app/Finance/TransactionFormDialog"
import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/queries/use-clients"
import { useFinancialTransactions } from "@/hooks/queries/use-finance"
import { useInventoryItems } from "@/hooks/queries/use-inventory"
import { useAllSaleItems, useAllServiceOrderItems } from "@/hooks/queries/use-reports"
import {
  useCreateRecurringExpenseRule,
  useRecurringExpenseRules,
  useToggleRecurringExpenseRule,
} from "@/hooks/queries/use-recurring-expenses"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { supabase } from "@/lib/supabase/client"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type PeriodPreset = "today" | "7d" | "this_month" | "last_month" | "90d" | "custom"

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "7 dias",
  this_month: "Mês Atual",
  last_month: "Mês Passado",
  "90d": "90 dias",
  custom: "Personalizar",
}

function periodRange(preset: PeriodPreset, customStart: string, customEnd: string): { start: Date; end: Date } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfToday }
    case "7d":
      return { start: startOfDay(new Date(now.getTime() - 6 * 86_400_000)), end: endOfToday }
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfToday }
    case "last_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      }
    case "90d":
      return { start: startOfDay(new Date(now.getTime() - 89 * 86_400_000)), end: endOfToday }
    case "custom":
      return {
        start: customStart ? new Date(customStart) : startOfDay(now),
        end: customEnd ? new Date(`${customEnd}T23:59:59`) : endOfToday,
      }
  }
}

function PeriodFilter({
  preset,
  onChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  preset: PeriodPreset
  onChange: (p: PeriodPreset) => void
  customStart: string
  customEnd: string
  onCustomChange: (start: string, end: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(PERIOD_LABELS) as PeriodPreset[])
        .filter((p) => p !== "custom")
        .map((p) => (
          <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => onChange(p)}>
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
            Personalizar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Período personalizado</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>De</Label>
              <Input type="date" value={customStart} onChange={(e) => onCustomChange(e.target.value, customEnd)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Até</Label>
              <Input type="date" value={customEnd} onChange={(e) => onCustomChange(customStart, e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onChange("custom")
              }}
              disabled={!customStart || !customEnd}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RepairButton() {
  const [checking, setChecking] = useState(false)

  async function handleCheck() {
    setChecking(true)
    try {
      const [{ data: orders }, { data: orderItems }, { data: sales }, { data: saleItems }] = await Promise.all([
        supabase.from("service_orders").select("id, total_cents, discount_cents"),
        supabase.from("service_order_items").select("service_order_id, total_cents"),
        supabase.from("sales").select("id, total_cents, discount_cents"),
        supabase.from("sale_items").select("sale_id, total_cents"),
      ])

      const orderItemSums = new Map<string, number>()
      for (const item of orderItems ?? []) {
        orderItemSums.set(item.service_order_id, (orderItemSums.get(item.service_order_id) ?? 0) + item.total_cents)
      }
      const saleItemSums = new Map<string, number>()
      for (const item of saleItems ?? []) {
        saleItemSums.set(item.sale_id, (saleItemSums.get(item.sale_id) ?? 0) + item.total_cents)
      }

      let mismatches = 0
      for (const order of orders ?? []) {
        const expected = Math.max((orderItemSums.get(order.id) ?? 0) - order.discount_cents, 0)
        if (expected !== order.total_cents) mismatches++
      }
      for (const sale of sales ?? []) {
        const expected = Math.max((saleItemSums.get(sale.id) ?? 0) - sale.discount_cents, 0)
        if (expected !== sale.total_cents) mismatches++
      }

      if (mismatches === 0) {
        toast.success("Tudo certo!", { description: "Nenhuma inconsistência encontrada entre itens e totais." })
      } else {
        toast.warning(`${mismatches} inconsistência(s) encontrada(s)`, {
          description: "Totais de OS/vendas não batem com a soma dos itens — revise manualmente por enquanto.",
        })
      }
    } catch (error) {
      toast.error("Não foi possível verificar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleCheck} disabled={checking}>
      <RefreshCw className={checking ? "size-4 animate-spin" : "size-4"} />
      {checking ? "Verificando..." : "Reparar"}
    </Button>
  )
}

function VisaoGeralTab({ transactions, isLoading }: { transactions: ReturnType<typeof useFinancialTransactions>["data"]; isLoading: boolean }) {
  const { totalIncome, totalExpense, byPaymentMethod, byMonth } = useMemo(() => {
    let income = 0
    let expense = 0
    const paymentTotals = new Map<string, number>()
    const monthTotals = new Map<string, number>()

    for (const t of transactions ?? []) {
      if (t.type === "income") income += t.amount_cents
      else expense += t.amount_cents

      const method = t.payment_method ?? "other"
      paymentTotals.set(method, (paymentTotals.get(method) ?? 0) + t.amount_cents)

      const month = t.occurred_on.slice(0, 7)
      const signedAmount = t.type === "income" ? t.amount_cents : -t.amount_cents
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + signedAmount)
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      byPaymentMethod: Array.from(paymentTotals.entries()),
      byMonth: Array.from(monthTotals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, cents]) => ({ month, value: cents / 100 })),
    }
  }, [transactions])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Entradas" value={formatCents(totalIncome)} tone="success" />
        <StatCard label="Saídas" value={formatCents(totalExpense)} tone="warning" />
        <StatCard label="Saldo" value={formatCents(totalIncome - totalExpense)} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum lançamento nesse período"
          description="Registre entradas e saídas pra acompanhar o caixa."
        />
      ) : (
        <>
          {byMonth.length > 1 && (
            <div className="border-border h-56 rounded-2xl border p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCents(Number(value) * 100)} />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {byPaymentMethod.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {byPaymentMethod.map(([method, cents]) => (
                <StatCard
                  key={method}
                  label={PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}
                  value={formatCents(cents)}
                />
              ))}
            </div>
          )}

          <div className="border-border overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.occurred_on).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="capitalize">{t.category}</TableCell>
                    <TableCell>{t.payment_method ? PAYMENT_METHOD_LABELS[t.payment_method] : "—"}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${t.type === "income" ? "text-success" : "text-destructive"}`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCents(t.amount_cents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function ReparosEEstoqueTab() {
  const { data: serviceItems, isLoading } = useAllServiceOrderItems()
  const { data: inventoryItems } = useInventoryItems()

  const stats = useMemo(() => {
    const items = serviceItems ?? []
    const costById = new Map((inventoryItems ?? []).map((i) => [i.id, i.cost_cents]))

    const revenueCents = items.reduce((sum, i) => sum + i.total_cents, 0)
    const costCents = items.reduce(
      (sum, i) => sum + (i.kind === "part" && i.inventory_item_id ? (costById.get(i.inventory_item_id) ?? 0) * i.quantity : 0),
      0
    )
    const orderIds = new Set(items.map((i) => i.service_order_id))
    const avgTicket = orderIds.size > 0 ? revenueCents / orderIds.size : 0

    return { revenueCents, costCents, profitCents: revenueCents - costCents, avgTicket }
  }, [serviceItems, inventoryItems])

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Faturamento Serviços" value={formatCents(stats.revenueCents)} tone="success" />
      <StatCard label="Custos Operacionais" value={formatCents(stats.costCents)} tone="warning" />
      <StatCard label="Lucro (Serviços)" value={formatCents(stats.profitCents)} tone={stats.profitCents >= 0 ? "success" : "destructive"} />
      <StatCard label="Ticket Médio" value={formatCents(stats.avgTicket)} />
    </div>
  )
}

function VendasELojaTab() {
  const { data: saleItems, isLoading } = useAllSaleItems()
  const { data: inventoryItems } = useInventoryItems()

  const stats = useMemo(() => {
    const items = saleItems ?? []
    const costById = new Map((inventoryItems ?? []).map((i) => [i.id, i.cost_cents]))

    const revenueCents = items.reduce((sum, i) => sum + i.total_cents, 0)
    const cmvCents = items.reduce(
      (sum, i) => sum + (i.inventory_item_id ? (costById.get(i.inventory_item_id) ?? 0) * i.quantity : 0),
      0
    )
    const grossProfitCents = revenueCents - cmvCents
    const marginPercent = revenueCents > 0 ? Math.round((grossProfitCents / revenueCents) * 100) : 0

    return { revenueCents, cmvCents, grossProfitCents, marginPercent }
  }, [saleItems, inventoryItems])

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Vendas Loja" value={formatCents(stats.revenueCents)} tone="success" />
      <StatCard label="Custo de Mercadoria (CMV)" value={formatCents(stats.cmvCents)} tone="warning" />
      <StatCard label="Lucro Bruto" value={formatCents(stats.grossProfitCents)} tone={stats.grossProfitCents >= 0 ? "success" : "destructive"} />
      <StatCard label="Margem %" value={`${stats.marginPercent}%`} />
    </div>
  )
}

const ACTIVE_STATUSES = ["received", "diagnosing", "awaiting_approval", "awaiting_parts", "in_repair"]

function AReceberTab() {
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const { data: clients } = useClients()
  const [search, setSearch] = useState("")

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients ?? []) map.set(c.id, c.full_name)
    return map
  }, [clients])

  const receivable = useMemo(() => {
    return (serviceOrders ?? []).filter(
      (o) => (ACTIVE_STATUSES.includes(o.status) || o.status === "ready_for_pickup") && o.total_cents > 0
    )
  }, [serviceOrders])

  const filtered = receivable.filter((o) => {
    if (!search.trim()) return true
    const term = search.trim().toLowerCase()
    const clientName = o.client_id ? (clientsById.get(o.client_id) ?? "") : ""
    return String(o.os_number).includes(term) || clientName.toLowerCase().includes(term)
  })

  const overdue = filtered.filter((o) => o.status === "ready_for_pickup")
  const upcoming = filtered.filter((o) => o.status !== "ready_for_pickup")
  const totalCents = filtered.reduce((sum, o) => sum + o.total_cents, 0)

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total a Receber" value={formatCents(totalCents)} tone="warning" />
        <StatCard label="Vencidas" value={formatCents(overdue.reduce((s, o) => s + o.total_cents, 0))} tone="destructive" />
        <StatCard label="A Vencer" value={formatCents(upcoming.reduce((s, o) => s + o.total_cents, 0))} />
      </div>

      <Input placeholder="Buscar por cliente ou OS..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <p className="text-muted-foreground text-xs">
        Esses valores ainda não entram no caixa — só contam quando o pagamento é registrado (na entrega da OS ou num
        lançamento manual).
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="Nada a receber" description="Nenhuma OS em aberto com valor pendente." />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.os_number}</TableCell>
                  <TableCell>{order.client_id ? (clientsById.get(order.client_id) ?? "—") : "Sem cliente"}</TableCell>
                  <TableCell>{order.status === "ready_for_pickup" ? "Vencida" : "A vencer"}</TableCell>
                  <TableCell className="text-right">{formatCents(order.total_cents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function NewRuleDialog() {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [dayOfMonth, setDayOfMonth] = useState(5)
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly")
  const createRule = useCreateRecurringExpenseRule()

  async function handleSave() {
    if (!description.trim() || amount <= 0) {
      toast.error("Informe descrição e valor")
      return
    }
    try {
      await createRule.mutateAsync({
        description,
        amount_cents: amount,
        frequency,
        day_of_month: frequency === "monthly" ? dayOfMonth : null,
      })
      toast.success("Automação criada")
      setOpen(false)
      setDescription("")
      setAmount(0)
    } catch (error) {
      toast.error("Não foi possível criar a automação", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Nova Automação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova despesa fixa</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input placeholder="Ex: Aluguel" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount / 100}
              onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100) || 0)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequency === "monthly" && (
            <div className="flex flex-col gap-1.5">
              <Label>Dia do mês</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value) || 1)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={createRule.isPending}>
            {createRule.isPending ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DespesasFixasTab() {
  const { data: rules, isLoading } = useRecurringExpenseRules()
  const toggleRule = useToggleRecurringExpenseRule()

  const activeRules = (rules ?? []).filter((r) => r.is_active)
  const projectedCents = activeRules.reduce(
    (sum, r) => sum + (r.frequency === "monthly" ? r.amount_cents : r.amount_cents * 4),
    0
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Regras Ativas" value={String(activeRules.length)} />
        <StatCard label="Projetado no Mês" value={formatCents(projectedCents)} tone="warning" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm font-semibold">Cobranças Configuradas</p>
        <NewRuleDialog />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma despesa fixa cadastrada"
          description="Cadastre uma vez e deixe o sistema lembrar sozinho — ideal pra aluguel, energia, internet."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          {rules.map((rule) => (
            <div key={rule.id} className="border-border flex items-center justify-between border-b p-3 last:border-b-0">
              <div>
                <p className="text-foreground text-sm font-medium">{rule.description}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCents(rule.amount_cents)} · {rule.frequency === "monthly" ? `todo dia ${rule.day_of_month}` : "semanal"}
                </p>
              </div>
              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, isActive: checked })}
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        A geração automática do lançamento no dia configurado entra numa fase futura (precisa de um agendador —
        Supabase Cron ou Vercel Cron — conectado a um projeto real).
      </p>
    </div>
  )
}

function FinancePage() {
  const { data: allTransactions, isLoading } = useFinancialTransactions()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("this_month")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const { start, end } = periodRange(periodPreset, customStart, customEnd)

  const transactions = useMemo(() => {
    return (allTransactions ?? []).filter((t) => {
      const date = new Date(t.occurred_on)
      return date >= start && date <= end
    })
  }, [allTransactions, start, end])

  function handleExportReport() {
    if (transactions.length === 0) {
      toast.error("Nenhum dado pra exportar nesse período")
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
    a.download = `bancada-financeiro-${periodPreset}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Relatório exportado")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, margem e fechamento do período."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RepairButton />
            <Button variant="outline" className="gap-2" onClick={handleExportReport}>
              <Download className="size-4" />
              Relatório
            </Button>
            <TransactionFormDialog defaultType="expense" />
            <TransactionFormDialog defaultType="income" />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodFilter
          preset={periodPreset}
          onChange={setPeriodPreset}
          customStart={customStart}
          customEnd={customEnd}
          onCustomChange={(s, e) => {
            setCustomStart(s)
            setCustomEnd(e)
          }}
        />
        <span className="text-muted-foreground text-xs">Período exibido: {PERIOD_LABELS[periodPreset]}</span>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="repairs">Reparos e Estoque</TabsTrigger>
          <TabsTrigger value="store">Vendas e Loja</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="fixed-expenses">Despesas Fixas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <VisaoGeralTab transactions={transactions} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="repairs" className="mt-4">
          <ReparosEEstoqueTab />
        </TabsContent>

        <TabsContent value="store" className="mt-4">
          <VendasELojaTab />
        </TabsContent>

        <TabsContent value="receivable" className="mt-4">
          <AReceberTab />
        </TabsContent>

        <TabsContent value="fixed-expenses" className="mt-4">
          <DespesasFixasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="finance">
      <FinancePage />
    </ModuleGate>
  )
}
