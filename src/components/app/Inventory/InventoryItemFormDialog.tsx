import { zodResolver } from "@hookform/resolvers/zod"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
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
import { useCreateInventoryItem, useUpdateInventoryItem } from "@/hooks/queries/use-inventory"
import type { Database } from "@/lib/supabase/types"
import {
  inventoryItemFormSchema,
  type InventoryItemFormValues,
} from "@/lib/validators/inventory.schema"

type InventoryItemRow = Database["public"]["Tables"]["inventory_items"]["Row"]

interface InventoryItemFormDialogProps {
  trigger: ReactNode
  item?: InventoryItemRow
}

export function InventoryItemFormDialog({ trigger, item }: InventoryItemFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const isEdit = !!item

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      name: item?.name ?? "",
      category: item?.category ?? "",
      sku: item?.sku ?? "",
      unit: item?.unit ?? "un",
      min_quantity_alert: item?.min_quantity_alert ?? 1,
      cost_cents: item?.cost_cents ?? 0,
      sale_price_cents: item?.sale_price_cents ?? 0,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: item?.name ?? "",
        category: item?.category ?? "",
        sku: item?.sku ?? "",
        unit: item?.unit ?? "un",
        min_quantity_alert: item?.min_quantity_alert ?? 1,
        cost_cents: item?.cost_cents ?? 0,
        sale_price_cents: item?.sale_price_cents ?? 0,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: InventoryItemFormValues) {
    try {
      if (isEdit && item) {
        await updateItem.mutateAsync({ id: item.id, ...values })
        toast.success("Item atualizado")
      } else {
        await createItem.mutateAsync({ ...values, quantity: 0 })
        toast.success("Item cadastrado — use o ajuste de estoque pra lançar a quantidade inicial")
      }
      setOpen(false)
    } catch (error) {
      toast.error("Não foi possível salvar o item", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar item" : "Novo item de estoque"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tela iPhone 12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="un" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cost_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value / 100}
                        onChange={(e) => field.onChange(Math.round(Number(e.target.value) * 100) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sale_price_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venda (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value / 100}
                        onChange={(e) => field.onChange(Math.round(Number(e.target.value) * 100) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="min_quantity_alert"
              render={({ field }) => (
                <FormItem className="max-w-40">
                  <FormLabel>Alerta de estoque baixo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
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
