import { z } from "zod"

export const resaleDeviceFormSchema = z.object({
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  storage_capacity: z.string().optional(),
  color: z.string().optional(),
  imei: z.string().optional(),
  condition: z.enum(["new", "sealed", "used_excellent", "used_good", "used_fair"]),
  cost_cents: z.number().int().min(0),
  price_cents: z.number().int().min(1, "Informe um preço"),
  description: z.string().optional(),
  is_public: z.boolean(),
})
export type ResaleDeviceFormValues = z.infer<typeof resaleDeviceFormSchema>

export const showcaseSettingsFormSchema = z.object({
  is_enabled: z.boolean(),
  whatsapp_number: z.string().optional(),
  headline: z.string().optional(),
  show_prices: z.boolean(),
})
export type ShowcaseSettingsFormValues = z.infer<typeof showcaseSettingsFormSchema>

/**
 * Full 7-step Aparelhos wizard — one shared form for the whole flow (same
 * pattern as the Nova OS wizard). "tipo" (seminovo/lacrado/usado) is UI-only
 * — it steers which fields are emphasized but isn't itself a DB column;
 * `condition` already captures the resulting estado estético.
 */
export const resaleDeviceWizardSchema = z.object({
  // Step 1 — tipo (UI hint only, not persisted as its own column)
  device_type: z.enum(["seminovo", "lacrado", "usado"]),

  // Step 2 — identificação
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  color: z.string().optional(),
  storage_capacity: z.string().optional(),
  imei: z.string().optional(),

  // Step 3 — estado
  condition: z.enum(["new", "sealed", "used_excellent", "used_good", "used_fair"]),
  description: z.string().optional(),

  // Step 4 — fotos (stub, see wizard page) + o que acompanha
  accompanying_items: z.array(z.string()),

  // Step 5 — origem e custo
  acquisition_source: z
    .enum(["fornecedor", "comprado_de_cliente", "recebido_em_troca", "estoque_proprio", "consignado"])
    .nullable(),
  acquisition_source_name: z.string().optional(),
  cost_cents: z.number().int().min(0),
  repair_cost_cents: z.number().int().min(0),

  // Step 6 — preço e garantia
  price_cents: z.number().int().min(1, "Informe o preço anunciado"),
  min_price_cents: z.number().int().min(0).nullable(),
  warranty_months: z.number().int().min(0),

  // Step 7 — estoque e localização
  status: z.enum(["available", "reserved", "sold"]),
  is_public: z.boolean(),
  physical_location: z.string().optional(),
})
export type ResaleDeviceWizardValues = z.infer<typeof resaleDeviceWizardSchema>

export const ACCOMPANYING_ITEM_TAGS = [
  "Caixa",
  "Carregador",
  "Cabo",
  "Fone",
  "Nota Fiscal",
  "Película Aplicada",
  "Capinha",
] as const
