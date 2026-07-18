import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { FinancialTransactionFormValues } from "@/lib/validators/finance.schema"

export function useFinancialTransactions() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["financial-transactions", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async (input: FinancialTransactionFormValues) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert({
          company_id: company.id,
          type: input.type,
          category: input.category,
          amount_cents: input.amount_cents,
          payment_method: input.payment_method,
          description: input.description || null,
          occurred_on: input.occurred_on,
          reference_type: "manual",
          created_by: profile.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financial-transactions"] }),
  })
}
