import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type InventoryItemInsert = Database["public"]["Tables"]["inventory_items"]["Insert"]

export function useInventoryItems() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["inventory-items", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<InventoryItemInsert, "company_id">) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({ ...input, company_id: company.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InventoryItemInsert>) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}

/** Manual stock adjustment (count correction, restock, etc) — goes through the same atomic, race-safe RPC the OS/POS triggers use. */
export function useAdjustInventoryStock() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ inventoryItemId, delta }: { inventoryItemId: string; delta: number }) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")
      const { error } = await supabase.rpc("fn_adjust_inventory_stock", {
        p_inventory_item_id: inventoryItemId,
        p_company_id: company.id,
        p_delta: delta,
        p_movement_type: "manual_adjustment",
        p_reference_type: "manual",
        p_reference_id: null,
        p_created_by: profile.id,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}
