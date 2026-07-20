import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import type { QuoteItemValues, QuoteWizardValues } from "@/lib/validators/quote.schema"
import type { QuoteStatus } from "@/types/domain"

type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"]

/**
 * Every quotes column `authenticated` can actually select, per the GRANT
 * list in 0030_device_secret_column_lockdown.sql — deliberately not
 * `select("*")`. A literal `SELECT *` expands to every column at parse
 * time and then requires privilege on all of them, so once
 * device_unlock_secret_encrypted was column-revoked, `select("*")` on
 * quotes fails outright ("permission denied for table quotes") instead of
 * gracefully omitting just that column. Used here and by
 * useConvertQuoteToServiceOrder below. Add new columns to both this list
 * and that migration's GRANT list together, or they'll silently stop
 * coming back from these queries.
 *
 * The explicit `.returns<>()` calls below exist because this string is
 * built with `+` (not a single literal), so postgrest-js's select parser
 * can't statically infer a row shape from it and would otherwise fall back
 * to an error type — `.returns<>()` overrides that with the real Row type.
 * device_unlock_secret_encrypted is never actually present at runtime
 * (that's the whole point), but nothing reads it anymore — everything uses
 * has_device_unlock_secret instead.
 */
const QUOTE_COLUMNS =
  "id, company_id, quote_number, client_id, client_device_id, status, device_description, " +
  "reported_issue, technician_diagnosis, checklist, notes, subtotal_cents, discount_cents, " +
  "total_cents, received_by, assigned_to, service_order_id, converted_at, has_device_unlock_secret, " +
  "created_by, created_at, updated_at"

export function useQuotes() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["quotes", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(QUOTE_COLUMNS)
        .order("created_at", { ascending: false })
        .returns<QuoteRow[]>()
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["quotes", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(QUOTE_COLUMNS)
        .eq("id", id!)
        .single()
        .returns<QuoteRow>()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useQuoteItems(quoteId: string | undefined) {
  return useQuery({
    queryKey: ["quote-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId!)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!quoteId,
  })
}

interface CreateQuoteInput {
  form: QuoteWizardValues
  items: QuoteItemValues[]
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ form, items }: CreateQuoteInput) => {
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
      const totalCents = Math.max(subtotalCents - form.discount_cents, 0)

      const { data: quote, error } = await supabase
        .from("quotes")
        .insert({
          company_id: company.id,
          client_id: form.client_id,
          client_device_id: clientDeviceId,
          device_description: [form.device_brand, form.device_model].filter(Boolean).join(" ") || null,
          reported_issue: form.reported_issue,
          technician_diagnosis: form.technician_diagnosis || null,
          checklist: {
            physical_tags: form.physical_tags,
            accessories_left: form.accessories_left,
          },
          notes: form.notes || null,
          subtotal_cents: subtotalCents,
          discount_cents: form.discount_cents,
          total_cents: totalCents,
          received_by: form.received_by,
          assigned_to: form.assigned_to,
          created_by: profile.id,
        })
        .select()
        .single()
      if (error) throw error

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(
          items.map((item) => ({
            quote_id: quote.id,
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

      return quote
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  })
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  })
}

/**
 * Converts an approved quote into a real OS — reuses the exact insert shape
 * of useCreateServiceOrder, carrying forward client, device, diagnosis,
 * checklist and responsibility fields already captured on the quote (not
 * just client + line items), then marks the quote 'convertido' and links
 * service_order_id back to it.
 */
export function useConvertQuoteToServiceOrder() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async (quoteId: string) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(QUOTE_COLUMNS)
        .eq("id", quoteId)
        .single()
        .returns<QuoteRow>()
      if (quoteError) throw quoteError
      if (quote.status !== "aprovado") throw new Error("Só orçamentos aprovados podem virar OS")

      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
      if (itemsError) throw itemsError

      const { data: serviceOrder, error: createError } = await supabase
        .from("service_orders")
        .insert({
          company_id: company.id,
          client_id: quote.client_id,
          client_device_id: quote.client_device_id,
          reported_issue: quote.reported_issue || quote.device_description || "Convertido de orçamento",
          technician_diagnosis: quote.technician_diagnosis,
          checklist: quote.checklist,
          received_by: quote.received_by,
          assigned_to: quote.assigned_to,
          subtotal_cents: quote.subtotal_cents,
          discount_cents: quote.discount_cents,
          total_cents: quote.total_cents,
          created_by: profile.id,
        })
        .select()
        .single()
      if (createError) throw createError

      // device_unlock_secret_encrypted is column-revoked from `authenticated`
      // (0030) — `quote` above never actually has it (has_device_unlock_secret
      // is the safe boolean stand-in), so it can't be copied by value here.
      // fn_copy_quote_device_secret does the copy server-side instead.
      if (quote.has_device_unlock_secret) {
        const { error: copySecretError } = await supabase.rpc("fn_copy_quote_device_secret", {
          p_quote_id: quoteId,
          p_service_order_id: serviceOrder.id,
        })
        if (copySecretError) throw copySecretError
      }

      if (items.length > 0) {
        const { error: insertItemsError } = await supabase.from("service_order_items").insert(
          items.map((item) => ({
            service_order_id: serviceOrder.id,
            company_id: company.id,
            kind: item.kind,
            inventory_item_id: item.inventory_item_id,
            services_catalog_id: item.services_catalog_id,
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
          }))
        )
        if (insertItemsError) throw insertItemsError
      }

      const { error: linkError } = await supabase
        .from("quotes")
        .update({
          status: "convertido",
          service_order_id: serviceOrder.id,
          converted_at: new Date().toISOString(),
        })
        .eq("id", quoteId)
      if (linkError) throw linkError

      return serviceOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      queryClient.invalidateQueries({ queryKey: ["service-orders"] })
    },
  })
}
