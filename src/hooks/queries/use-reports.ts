import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"

/** Broader reads than the operational hooks (use-sales.ts caps to "today") — Relatórios needs full history to aggregate. */
export function useAllSales() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["reports", "all-sales", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1000)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useAllSaleItems() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["reports", "all-sale-items", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sale_items").select("*").limit(2000)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useAllServiceOrderItems() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["reports", "all-service-order-items", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_order_items").select("*").limit(2000)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useAllClientTotals() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["reports", "all-client-totals", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_client_totals").select("*")
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

/** All clients, uncapped-ish (500) — the operational useClients() caps to 50 for the list-page search UX. */
export function useAllClients() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["reports", "all-clients", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").limit(500)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}
