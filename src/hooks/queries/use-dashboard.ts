import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import { SERVICE_ORDER_STATUS_ORDER } from "@/lib/constants"
import type { ServiceOrderStatus } from "@/types/domain"

export function useDashboardSummary() {
  const { company } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  return useQuery({
    queryKey: ["dashboard-summary", company?.id, today],
    queryFn: async () => {
      const [{ data: transactions, error: txError }, { data: serviceOrders, error: osError }] = await Promise.all([
        supabase.from("financial_transactions").select("type, amount_cents").eq("occurred_on", today),
        supabase.from("service_orders").select("status"),
      ])
      if (txError) throw txError
      if (osError) throw osError

      let incomeCents = 0
      let expenseCents = 0
      for (const t of transactions ?? []) {
        if (t.type === "income") incomeCents += t.amount_cents
        else expenseCents += t.amount_cents
      }

      const statusCounts = SERVICE_ORDER_STATUS_ORDER.reduce(
        (acc, status) => {
          acc[status] = 0
          return acc
        },
        {} as Record<ServiceOrderStatus, number>
      )
      let openOrdersCount = 0
      for (const order of serviceOrders ?? []) {
        if (order.status === "cancelled") continue
        statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1
        if (order.status !== "delivered") openOrdersCount += 1
      }

      const marginPercent = incomeCents > 0 ? Math.round(((incomeCents - expenseCents) / incomeCents) * 100) : 0

      return {
        todayRevenueCents: incomeCents,
        todayExpenseCents: expenseCents,
        marginPercent,
        statusCounts,
        openOrdersCount,
      }
    },
    enabled: !!company,
  })
}
