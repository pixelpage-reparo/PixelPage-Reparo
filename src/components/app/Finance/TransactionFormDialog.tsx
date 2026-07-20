import { zodResolver } from "@hookform/resolvers/zod"
import { CircleMinus, CirclePlus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateFinancialTransaction } from "@/hooks/queries/use-finance"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import {
  financialTransactionFormSchema,
  type FinancialTransactionFormValues,
} from "@/lib/validators/finance.schema"
import type { PaymentMethod } from "@/types/domain"

interface TransactionFormDialogProps {
  /** Presets the dialog's type — used by the header's separate Despesa/Receita buttons. */
  defaultType?: "income" | "expense"
}

export function TransactionFormDialog({ defaultType = "income" }: TransactionFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createTransaction = useCreateFinancialTransaction()

  const form = useForm<FinancialTransactionFormValues>({
    resolver: zodResolver(financialTransactionFormSchema),
    defaultValues: {
      type: defaultType,
      category: "",
      amount_cents: 0,
      payment_method: "pix",
      description: "",
      occurred_on: new Date().toISOString().slice(0, 10),
    },
  })

  async function onSubmit(values: FinancialTransactionFormValues) {
    try {
      await createTransaction.mutateAsync(values)
      toast.success("Lançamento registrado")
      setOpen(false)
      form.reset({ ...form.formState.defaultValues, type: defaultType } as FinancialTransactionFormValues)
    } catch (error) {
      toast.error("Não foi possível registrar o lançamento", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) form.setValue("type", defaultType)
      }}
    >
      <DialogTrigger asChild>
        <Button variant={defaultType === "expense" ? "destructive" : "default"} className="gap-2">
          {defaultType === "expense" ? <CircleMinus className="size-4" /> : <CirclePlus className="size-4" />}
          {defaultType === "expense" ? "Despesa" : "Receita"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Entrada</SelectItem>
                      <SelectItem value="expense">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: aluguel, OS, venda avulsa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value / 100}
                        onChange={(e) => field.onChange(Math.round(Number(e.target.value) * 100) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occurred_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v as PaymentMethod)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
