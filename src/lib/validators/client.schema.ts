import { z } from "zod"

export const clientFormSchema = z.object({
  full_name: z.string().min(2, "Informe o nome do cliente"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("Informe um e-mail válido").optional().or(z.literal("")),
  document: z.string().optional(),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
})
export type ClientFormValues = z.infer<typeof clientFormSchema>
