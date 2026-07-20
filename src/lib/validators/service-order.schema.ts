import { z } from "zod"

export const serviceOrderItemSchema = z.object({
  kind: z.enum(["service", "part"]),
  inventory_item_id: z.string().uuid().nullable().optional(),
  services_catalog_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Descreva o item"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  unit_price_cents: z.coerce.number().int().min(0, "Valor não pode ser negativo"),
})
export type ServiceOrderItemValues = z.infer<typeof serviceOrderItemSchema>

export const PHYSICAL_CONDITION_TAGS = [
  "Sinais de Água",
  "Carcaça Amassada",
  "Botões Falhando",
  "Câmera Danificada",
  "Reiniciando",
  "Riscos na Tela",
  "Vidro Trincado",
  "Traseira Trincada",
] as const

export const ACCESSORY_TAGS = ["Capa", "Carregador", "Chip", "Cartão de Memória"] as const

/**
 * Full wizard schema — one shared form for all 6 steps (see the Stepper
 * primitive's design note). STEP_FIELDS below maps each step to the subset
 * `form.trigger()` validates before "Continuar" advances.
 */
export const serviceOrderWizardSchema = z.object({
  // Step 1 — client
  client_id: z.string().uuid().nullable(),

  // Step 2 — device
  client_device_id: z.string().uuid().nullable(),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  device_color: z.string().optional(),
  device_serial_or_imei: z.string().optional(),

  // Step 3 — diagnosis & physical state
  reported_issue: z.string().min(3, "Descreva o problema relatado pelo cliente"),
  technician_diagnosis: z.string().optional(),
  accessories_left: z.array(z.string()),
  physical_tags: z.array(z.string()),
  screen_ok: z.boolean(),
  camera_ok: z.boolean(),
  audio_ok: z.boolean(),
  connectivity_ok: z.boolean(),
  checklist_notes: z.string().optional(),

  // Step 4 — device lock (deliberately NOT sent to the server — see
  // CompleteSignupPage-adjacent note in the wizard page. Collected here only
  // so the review step can show it back to the person entering it before
  // they hand the device to a technician.)
  lock_type: z.enum(["none", "password", "pattern"]),
  lock_value: z.string().optional(),

  // Step 5 — services/parts + responsibility
  warranty_days: z.number().int().min(0),
  received_by: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
})
export type ServiceOrderWizardValues = z.infer<typeof serviceOrderWizardSchema>

export const SERVICE_ORDER_WIZARD_STEP_FIELDS: Record<number, (keyof ServiceOrderWizardValues)[]> = {
  0: ["client_id"],
  1: [],
  2: ["reported_issue"],
  3: ["lock_type"],
  4: [],
  5: [],
}
