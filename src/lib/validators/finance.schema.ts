import { z } from "zod"

export const financialTransactionFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(2, "Informe uma categoria"),
  amount_cents: z.number().int().min(1, "Informe um valor maior que zero"),
  payment_method: z.enum(["cash", "pix", "debit", "credit", "bank_transfer", "other"]).nullable(),
  description: z.string().optional(),
  occurred_on: z.string().min(1, "Informe a data"),
})
export type FinancialTransactionFormValues = z.infer<typeof financialTransactionFormSchema>
