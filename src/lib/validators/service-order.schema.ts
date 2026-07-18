import { z } from "zod"

export const serviceOrderItemSchema = z.object({
  kind: z.enum(["service", "part"]),
  inventory_item_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Descreva o item"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  unit_price_cents: z.coerce.number().int().min(0, "Valor não pode ser negativo"),
})
export type ServiceOrderItemValues = z.infer<typeof serviceOrderItemSchema>

export const serviceOrderFormSchema = z.object({
  client_id: z.string().uuid().nullable(),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  device_serial_or_imei: z.string().optional(),
  reported_issue: z.string().min(3, "Descreva o problema relatado pelo cliente"),
  screen_ok: z.boolean(),
  camera_ok: z.boolean(),
  audio_ok: z.boolean(),
  connectivity_ok: z.boolean(),
  checklist_notes: z.string().optional(),
  warranty_days: z.number().int().min(0),
})
export type ServiceOrderFormValues = z.infer<typeof serviceOrderFormSchema>
