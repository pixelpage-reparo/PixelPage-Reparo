import { z } from "zod"

export const inventoryItemFormSchema = z.object({
  name: z.string().min(2, "Informe o nome do item"),
  category: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, "Informe a unidade"),
  min_quantity_alert: z.number().int().min(0),
  cost_cents: z.number().int().min(0),
  sale_price_cents: z.number().int().min(0),
})
export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>
