import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import type {
  ServiceOrderItemValues,
  ServiceOrderWizardValues,
} from "@/lib/validators/service-order.schema"
import type { ServiceOrderStatus } from "@/types/domain"

type ServiceOrderRow = Database["public"]["Tables"]["service_orders"]["Row"]

/**
 * Every service_orders column `authenticated` can actually select, per the
 * GRANT list in 0030_device_secret_column_lockdown.sql — deliberately not
 * `select("*")`. A literal `SELECT *` expands to every column at parse
 * time and then requires privilege on all of them, so once
 * device_unlock_secret_encrypted was column-revoked, `select("*")` here
 * would fail outright with "permission denied for table service_orders"
 * instead of gracefully omitting just that column. Add new columns to both
 * this list and that migration's GRANT list together, or they'll silently
 * stop coming back from these two queries.
 *
 * The explicit `.returns<>()` calls below exist because this string is
 * built with `+` (not a single literal), so postgrest-js's select parser
 * can't statically infer a row shape from it and would otherwise fall back
 * to an error type — `.returns<>()` overrides that with the real Row type.
 * device_unlock_secret_encrypted is never actually present at runtime
 * (that's the whole point), but nothing reads it anymore — everything uses
 * has_device_unlock_secret instead.
 */
const SERVICE_ORDER_COLUMNS =
  "id, company_id, os_number, client_id, client_device_id, status, checklist, reported_issue, " +
  "technician_diagnosis, received_by, assigned_to, warranty_days, warranty_notes, subtotal_cents, " +
  "discount_cents, total_cents, signature_data_url, signed_at, delivered_at, has_device_unlock_secret, " +
  "created_by, created_at, updated_at"

export function useServiceOrders() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["service-orders", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(SERVICE_ORDER_COLUMNS)
        .order("created_at", { ascending: false })
        .returns<ServiceOrderRow[]>()
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
      const { data, error } = await supabase
        .from("service_orders")
        .select(SERVICE_ORDER_COLUMNS)
        .eq("id", id!)
        .single()
        .returns<ServiceOrderRow>()
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
  form: ServiceOrderWizardValues
  items: ServiceOrderItemValues[]
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ form, items }: CreateServiceOrderInput) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")

      let clientDeviceId: string | null = form.client_device_id
      if (
        !clientDeviceId &&
        form.client_id &&
        (form.device_brand || form.device_model || form.device_serial_or_imei)
      ) {
        const { data: device, error: deviceError } = await supabase
          .from("client_devices")
          .insert({
            client_id: form.client_id,
            company_id: company.id,
            brand: form.device_brand || null,
            model: form.device_model || null,
            color: form.device_color || null,
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
          technician_diagnosis: form.technician_diagnosis || null,
          checklist: {
            screen_ok: form.screen_ok,
            camera_ok: form.camera_ok,
            audio_ok: form.audio_ok,
            connectivity_ok: form.connectivity_ok,
            notes: form.checklist_notes ?? "",
            physical_tags: form.physical_tags,
            accessories_left: form.accessories_left,
          },
          warranty_days: form.warranty_days,
          received_by: form.received_by,
          assigned_to: form.assigned_to,
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
            services_catalog_id: item.services_catalog_id ?? null,
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
        services_catalog_id: item.services_catalog_id ?? null,
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
