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
