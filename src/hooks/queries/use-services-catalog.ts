import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type ServiceCatalogItemInsert = Database["public"]["Tables"]["services_catalog"]["Insert"]

export function useServicesCatalog() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["services-catalog", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services_catalog")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCreateServiceCatalogItem() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<ServiceCatalogItemInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("services_catalog")
        .insert({ ...input, company_id: company.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services-catalog"] }),
  })
}

export function useUpdateServiceCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ServiceCatalogItemInsert>) => {
      const { data, error } = await supabase
        .from("services_catalog")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services-catalog"] }),
  })
}

export function useDeactivateServiceCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services_catalog").update({ is_active: false }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services-catalog"] }),
  })
}
