import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { ServiceOrderFormValues } from "@/lib/validators/service-order.schema"
import type { ServiceOrderItemValues } from "@/lib/validators/service-order.schema"
import type { ServiceOrderStatus } from "@/types/domain"

export function useServiceOrders() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["service-orders", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["service-orders", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_orders").select("*").eq("id", id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useServiceOrderItems(serviceOrderId: string | undefined) {
  return useQuery({
    queryKey: ["service-order-items", serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_order_items")
        .select("*")
        .eq("service_order_id", serviceOrderId!)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!serviceOrderId,
  })
}

export function useServiceOrderStatusHistory(serviceOrderId: string | undefined) {
  return useQuery({
    queryKey: ["service-order-status-history", serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_order_status_history")
        .select("*")
        .eq("service_order_id", serviceOrderId!)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!serviceOrderId,
  })
}

interface CreateServiceOrderInput {
  form: ServiceOrderFormValues
  items: ServiceOrderItemValues[]
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ form, items }: CreateServiceOrderInput) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")

      let clientDeviceId: string | null = null
      if (form.client_id && (form.device_brand || form.device_model || form.device_serial_or_imei)) {
        const { data: device, error: deviceError } = await supabase
          .from("client_devices")
          .insert({
            client_id: form.client_id,
            company_id: company.id,
            brand: form.device_brand || null,
            model: form.device_model || null,
            serial_or_imei: form.device_serial_or_imei || null,
          })
          .select()
          .single()
        if (deviceError) throw deviceError
        clientDeviceId = device.id
      }

      const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0)

      const { data: serviceOrder, error } = await supabase
        .from("service_orders")
        .insert({
          company_id: company.id,
          client_id: form.client_id,
          client_device_id: clientDeviceId,
          reported_issue: form.reported_issue,
          checklist: {
            screen_ok: form.screen_ok,
            camera_ok: form.camera_ok,
            audio_ok: form.audio_ok,
            connectivity_ok: form.connectivity_ok,
            notes: form.checklist_notes ?? "",
          },
          warranty_days: form.warranty_days,
          subtotal_cents: subtotalCents,
          total_cents: subtotalCents,
          created_by: profile.id,
        })
        .select()
        .single()
      if (error) throw error

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("service_order_items").insert(
          items.map((item) => ({
            service_order_id: serviceOrder.id,
            company_id: company.id,
            kind: item.kind,
            inventory_item_id: item.inventory_item_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
          }))
        )
        if (itemsError) throw itemsError
      }

      return serviceOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-orders"] })
    },
  })
}

export function useAddServiceOrderItem(serviceOrderId: string) {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async (item: ServiceOrderItemValues) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { error } = await supabase.from("service_order_items").insert({
        service_order_id: serviceOrderId,
        company_id: company.id,
        kind: item.kind,
        inventory_item_id: item.inventory_item_id ?? null,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order-items", serviceOrderId] })
      queryClient.invalidateQueries({ queryKey: ["service-orders", "detail", serviceOrderId] })
    },
  })
}

export function useUpdateServiceOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceOrderStatus }) => {
      const patch: { status: ServiceOrderStatus; delivered_at?: string } = { status }
      if (status === "delivered") {
        patch.delivered_at = new Date().toISOString()
      }
      const { error } = await supabase.from("service_orders").update(patch).eq("id", id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-orders"] })
      queryClient.invalidateQueries({ queryKey: ["service-order-status-history", variables.id] })
    },
  })
}
