import { z } from "zod"

export const saleItemSchema = z.object({
  inventory_item_id: z.string().uuid().nullable(),
  description: z.string().min(1, "Descreva o item"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  unit_price_cents: z.coerce.number().int().min(0, "Valor não pode ser negativo"),
})
export type SaleItemValues = z.infer<typeof saleItemSchema>
