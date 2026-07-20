import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type RecurringExpenseRuleInsert = Database["public"]["Tables"]["recurring_expense_rules"]["Insert"]

export function useRecurringExpenseRules() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["recurring-expense-rules", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expense_rules")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCreateRecurringExpenseRule() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<RecurringExpenseRuleInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("recurring_expense_rules")
        .insert({ ...input, company_id: company.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-expense-rules"] }),
  })
}

export function useToggleRecurringExpenseRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("recurring_expense_rules").update({ is_active: isActive }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-expense-rules"] }),
  })
}
