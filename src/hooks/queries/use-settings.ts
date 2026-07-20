import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"]
type MessageTemplateInsert = Database["public"]["Tables"]["message_templates"]["Insert"]
type PaymentMethodFeeInsert = Database["public"]["Tables"]["payment_method_fees"]["Insert"]

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (updates: CompanyUpdate) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase.from("companies").update(updates).eq("id", company.id).select().single()
      if (error) throw error
      return data
    },
    // Company data lives in the auth store (set by loadProfileData), not
    // TanStack Query — invalidating here alone wouldn't refresh the
    // sidebar/topbar. The settings page calls refreshProfile() itself after
    // a successful save (see use-auth.ts), same pattern CompleteSignupPage
    // already uses after creating a company.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  })
}

export function useMessageTemplates() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["message-templates", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("template_key", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useUpsertMessageTemplate() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<MessageTemplateInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("message_templates")
        .upsert({ ...input, company_id: company.id }, { onConflict: "company_id,template_key" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["message-templates"] }),
  })
}

export function usePaymentMethodFees() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["payment-method-fees", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_method_fees")
        .select("*")
        .order("payment_method", { ascending: true })
        .order("installments", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useUpsertPaymentMethodFee() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<PaymentMethodFeeInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("payment_method_fees")
        .upsert({ ...input, company_id: company.id }, { onConflict: "company_id,payment_method,installments" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-method-fees"] }),
  })
}
