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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCreateResaleDevice, useUpdateResaleDevice } from "@/hooks/queries/use-showcase"
import { RESALE_CONDITION_LABELS } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"
import {
  resaleDeviceFormSchema,
  type ResaleDeviceFormValues,
} from "@/lib/validators/showcase.schema"
import type { ResaleDeviceCondition } from "@/types/domain"

type ResaleDeviceRow = Database["public"]["Tables"]["resale_devices"]["Row"]

interface ResaleDeviceFormDialogProps {
  trigger: ReactNode
  device?: ResaleDeviceRow
}

export function ResaleDeviceFormDialog({ trigger, device }: ResaleDeviceFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createDevice = useCreateResaleDevice()
  const updateDevice = useUpdateResaleDevice()
  const isEdit = !!device

  const defaults: ResaleDeviceFormValues = {
    brand: device?.brand ?? "",
    model: device?.model ?? "",
    storage_capacity: device?.storage_capacity ?? "",
    color: device?.color ?? "",
    imei: device?.imei ?? "",
    condition: device?.condition ?? "used_excellent",
    cost_cents: device?.cost_cents ?? 0,
    price_cents: device?.price_cents ?? 0,
    description: device?.description ?? "",
    is_public: device?.is_public ?? false,
  }

  const form = useForm<ResaleDeviceFormValues>({
    resolver: zodResolver(resaleDeviceFormSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) form.reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: ResaleDeviceFormValues) {
    try {
      if (isEdit && device) {
        await updateDevice.mutateAsync({ id: device.id, ...values })
        toast.success("Aparelho atualizado")
      } else {
        await createDevice.mutateAsync(values)
        toast.success("Aparelho cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error("Não foi possível salvar o aparelho", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar aparelho" : "Novo aparelho pra vitrine"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: iPhone 11 128GB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMEI</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condição</FormLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as ResaleDeviceCondition)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RESALE_CONDITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

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
                name="price_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de venda (R$)</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="border-border flex items-center justify-between rounded-xl border p-3">
                  <FormLabel>Visível na vitrine pública</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
