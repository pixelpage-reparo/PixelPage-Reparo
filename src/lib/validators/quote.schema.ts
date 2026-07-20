import { z } from "zod"

import { serviceOrderItemSchema } from "@/lib/validators/service-order.schema"

export const quoteItemSchema = serviceOrderItemSchema
export type QuoteItemValues = z.infer<typeof quoteItemSchema>

/**
 * Full 6-step Orçamentos wizard — same shape and step order as the Nova OS
 * wizard (serviceOrderWizardSchema), since an approved quote converts
 * directly into an OS and should carry every one of these fields forward.
 * One shared form for the whole flow, per the Stepper primitive's design.
 */
export const quoteWizardSchema = z.object({
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

  // Step 4 — device lock (not persisted — see the Nova OS wizard's note;
  // collected here only so the review step can show it back before the
  // device changes hands)
  lock_type: z.enum(["none", "password", "pattern"]),
  lock_value: z.string().optional(),

  // Step 5 — services/parts + responsibility
  discount_cents: z.number().int().min(0),
  received_by: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),

  // Step 6 — review
  notes: z.string().optional(),
  send_whatsapp: z.boolean(),
})
export type QuoteWizardValues = z.infer<typeof quoteWizardSchema>

export const QUOTE_WIZARD_STEP_FIELDS: Record<number, (keyof QuoteWizardValues)[]> = {
  0: ["client_id"],
  1: [],
  2: ["reported_issue"],
  3: ["lock_type"],
  4: [],
  5: [],
}
