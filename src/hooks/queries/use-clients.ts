import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

export function useClients(search?: string) {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["clients", company?.id, search ?? ""],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("full_name", { ascending: true })
        .limit(50)

      if (search && search.trim().length > 0) {
        query = query.ilike("full_name", `%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ["clients", "detail", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId!).single()
      if (error) throw error
      return data
    },
    enabled: !!clientId,
  })
}

export function useClientDevices(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-devices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_devices")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!clientId,
  })
}

export function useClientTotals(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-totals", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_client_totals")
        .select("*")
        .eq("client_id", clientId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!clientId,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<ClientInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...input, company_id: company.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ClientInsert>) => {
      const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["clients", "detail", data.id] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  })
}
