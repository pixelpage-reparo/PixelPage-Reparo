import { useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { TransactionFormDialog } from "@/components/app/Finance/TransactionFormDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFinancialTransactions } from "@/hooks/queries/use-finance"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { Wallet } from "lucide-react"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function FinancePage() {
  const { data: transactions, isLoading } = useFinancialTransactions()

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
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, margem e fechamento do dia."
        actions={<TransactionFormDialog />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Entradas" value={formatCents(totalIncome)} tone="success" />
        <StatCard label="Saídas" value={formatCents(totalExpense)} tone="warning" />
        <StatCard label="Saldo" value={formatCents(totalIncome - totalExpense)} />
      </div>

      <Tabs defaultValue="flow">
        <TabsList>
          <TabsTrigger value="flow">Fluxo de caixa</TabsTrigger>
          <TabsTrigger value="closing">Fechamento</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum lançamento ainda"
              description="Registre entradas e saídas pra acompanhar o caixa."
            />
          ) : (
            <div className="flex flex-col gap-6">
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="closing" className="mt-4">
          {byPaymentMethod.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nada pra fechar ainda"
              description="Assim que houver lançamentos, o fechamento por forma de pagamento aparece aqui."
            />
          ) : (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FinancePage
