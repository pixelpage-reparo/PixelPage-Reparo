import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { SaleItemValues } from "@/lib/validators/sale.schema"
import type { PaymentMethod } from "@/types/domain"

export function useTodaySales() {
  const { company } = useAuth()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  return useQuery({
    queryKey: ["sales", "today", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

interface CreateSaleInput {
  clientId: string | null
  serviceOrderId: string | null
  paymentMethod: PaymentMethod
  items: SaleItemValues[]
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ clientId, serviceOrderId, paymentMethod, items }: CreateSaleInput) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")
      if (items.length === 0) throw new Error("Adicione pelo menos um item")

      const totalCents = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0)

      const { data: sale, error } = await supabase
        .from("sales")
        .insert({
          company_id: company.id,
          client_id: clientId,
          service_order_id: serviceOrderId,
          payment_method: paymentMethod,
          subtotal_cents: totalCents,
          total_cents: totalCents,
          sold_by: profile.id,
        })
        .select()
        .single()
      if (error) throw error

      const { error: itemsError } = await supabase.from("sale_items").insert(
        items.map((item) => ({
          sale_id: sale.id,
          company_id: company.id,
          inventory_item_id: item.inventory_item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
        }))
      )
      if (itemsError) throw itemsError

      return sale
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  })
}
