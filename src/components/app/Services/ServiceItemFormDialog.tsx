"use client"

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
import { useCreateServiceCatalogItem, useUpdateServiceCatalogItem } from "@/hooks/queries/use-services-catalog"
import type { Database } from "@/lib/supabase/types"
import {
  serviceCatalogItemFormSchema,
  type ServiceCatalogItemFormValues,
} from "@/lib/validators/service-catalog.schema"

type ServiceCatalogItemRow = Database["public"]["Tables"]["services_catalog"]["Row"]

interface ServiceItemFormDialogProps {
  trigger: ReactNode
  item?: ServiceCatalogItemRow
}

export function ServiceItemFormDialog({ trigger, item }: ServiceItemFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createItem = useCreateServiceCatalogItem()
  const updateItem = useUpdateServiceCatalogItem()
  const isEdit = !!item

  const form = useForm<ServiceCatalogItemFormValues>({
    resolver: zodResolver(serviceCatalogItemFormSchema),
    defaultValues: {
      name: item?.name ?? "",
      category: item?.category ?? "",
      default_price_cents: item?.default_price_cents ?? 0,
      estimated_duration_minutes: item?.estimated_duration_minutes ?? null,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: item?.name ?? "",
        category: item?.category ?? "",
        default_price_cents: item?.default_price_cents ?? 0,
        estimated_duration_minutes: item?.estimated_duration_minutes ?? null,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: ServiceCatalogItemFormValues) {
    try {
      if (isEdit && item) {
        await updateItem.mutateAsync({ id: item.id, ...values })
        toast.success("Serviço atualizado")
      } else {
        await createItem.mutateAsync(values)
        toast.success("Serviço cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error("Não foi possível salvar o serviço", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Troca de tela" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="Opcional — ex: Telas, Baterias" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="default_price_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço padrão (R$)</FormLabel>
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
                name="estimated_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração estimada (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Opcional"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
