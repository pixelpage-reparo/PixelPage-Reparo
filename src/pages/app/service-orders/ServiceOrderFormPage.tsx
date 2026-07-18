import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ItemsFieldArray } from "@/components/app/ServiceOrders/ItemsFieldArray"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useClients } from "@/hooks/queries/use-clients"
import { useCreateServiceOrder } from "@/hooks/queries/use-service-orders"
import {
  serviceOrderFormSchema,
  type ServiceOrderFormValues,
  type ServiceOrderItemValues,
} from "@/lib/validators/service-order.schema"

const CHECKLIST_FIELDS = [
  { name: "screen_ok" as const, label: "Tela" },
  { name: "camera_ok" as const, label: "Câmera" },
  { name: "audio_ok" as const, label: "Áudio" },
  { name: "connectivity_ok" as const, label: "Conectividade" },
]

function ServiceOrderFormPage() {
  const navigate = useNavigate()
  const { data: clients } = useClients()
  const createServiceOrder = useCreateServiceOrder()
  const [items, setItems] = useState<ServiceOrderItemValues[]>([])

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(serviceOrderFormSchema),
    defaultValues: {
      client_id: null,
      device_brand: "",
      device_model: "",
      device_serial_or_imei: "",
      reported_issue: "",
      screen_ok: true,
      camera_ok: true,
      audio_ok: true,
      connectivity_ok: true,
      checklist_notes: "",
      warranty_days: 90,
    },
  })

  async function onSubmit(values: ServiceOrderFormValues) {
    try {
      const serviceOrder = await createServiceOrder.mutateAsync({ form: values, items })
      toast.success("OS criada com sucesso!")
      navigate(`/app/service-orders/${serviceOrder.id}`)
    } catch (error) {
      toast.error("Não foi possível criar a OS", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Nova Ordem de Serviço" description="Registre a entrada do aparelho." />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
            <p className="text-foreground text-sm font-semibold">Cliente e aparelho</p>

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clients ?? []).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="device_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apple" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="device_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: iPhone 12" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="device_serial_or_imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI / Número de série</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
            <p className="text-foreground text-sm font-semibold">Diagnóstico de entrada</p>

            <FormField
              control={form.control}
              name="reported_issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problema relatado pelo cliente</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: tela quebrada após queda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CHECKLIST_FIELDS.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="border-border flex items-center justify-between rounded-xl border p-3">
                      <FormLabel className="text-xs">{item.label}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="checklist_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações do checklist</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opcional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warranty_days"
              render={({ field }) => (
                <FormItem className="max-w-40">
                  <FormLabel>Garantia (dias)</FormLabel>
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
          </div>

          <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
            <p className="text-foreground text-sm font-semibold">Itens (serviços e peças)</p>
            <ItemsFieldArray items={items} onItemsChange={setItems} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/app/service-orders")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Criando..." : "Criar OS"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ServiceOrderFormPage
