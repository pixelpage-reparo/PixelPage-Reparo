import { z } from "zod"

export const serviceCatalogItemFormSchema = z.object({
  name: z.string().min(2, "Informe o nome do serviço"),
  category: z.string().optional(),
  default_price_cents: z.number().int().min(0),
  estimated_duration_minutes: z.number().int().min(0).nullable(),
})
export type ServiceCatalogItemFormValues = z.infer<typeof serviceCatalogItemFormSchema>
