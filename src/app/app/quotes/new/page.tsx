"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, MessageCircle, Plus, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { ClientFormDialog } from "@/components/app/Clients/ClientFormDialog"
import { ModuleGate } from "@/components/app/ModuleGate"
import { ItemsFieldArray } from "@/components/app/ServiceOrders/ItemsFieldArray"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Step, Stepper, StepperFooter, StepperHeader } from "@/components/ui/stepper"
import { Switch } from "@/components/ui/switch"
import { TagToggle } from "@/components/ui/tag-toggle"
import { Textarea } from "@/components/ui/textarea"
import { useClientDevices, useClients } from "@/hooks/queries/use-clients"
import { useSaveDeviceSecret } from "@/hooks/queries/use-device-secret"
import { useCreateQuote } from "@/hooks/queries/use-quotes"
import { useTeamMembers } from "@/hooks/queries/use-team"
import { cn } from "@/lib/utils"
import {
  ACCESSORY_TAGS,
  PHYSICAL_CONDITION_TAGS,
} from "@/lib/validators/service-order.schema"
import {
  QUOTE_WIZARD_STEP_FIELDS,
  quoteWizardSchema,
  type QuoteItemValues,
  type QuoteWizardValues,
} from "@/lib/validators/quote.schema"

const STEPS = [
  { id: "client", label: "Cliente" },
  { id: "device", label: "Aparelho" },
  { id: "diagnosis", label: "Diagnóstico" },
  { id: "lock", label: "Segurança" },
  { id: "items", label: "Serviços" },
  { id: "review", label: "Revisão" },
]

function NovoOrcamentoWizard() {
  const router = useRouter()
  const [items, setItems] = useState<QuoteItemValues[]>([])
  const [stepIndex, setStepIndex] = useState(0)

  const { data: clients } = useClients()
  const { data: teamMembers } = useTeamMembers()
  const createQuote = useCreateQuote()
  const saveDeviceSecret = useSaveDeviceSecret()

  const form = useForm<QuoteWizardValues>({
    resolver: zodResolver(quoteWizardSchema),
    defaultValues: {
      client_id: null,
      client_device_id: null,
      device_brand: "",
      device_model: "",
      device_color: "",
      device_serial_or_imei: "",
      reported_issue: "",
      technician_diagnosis: "",
      accessories_left: [],
      physical_tags: [],
      lock_type: "none",
      lock_value: "",
      discount_cents: 0,
      received_by: null,
      assigned_to: null,
      notes: "",
      send_whatsapp: true,
    },
  })

  const clientId = form.watch("client_id")
  const clientDeviceId = form.watch("client_device_id")
  const lockType = form.watch("lock_type")
  const accessoriesLeft = form.watch("accessories_left")
  const physicalTags = form.watch("physical_tags")

  const selectedClient = clients?.find((c) => c.id === clientId)
  const { data: clientDevices } = useClientDevices(clientId ?? undefined)

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0)
  const totalCents = Math.max(subtotalCents - form.watch("discount_cents"), 0)

  async function handleFinish() {
    const valid = await form.trigger()
    if (!valid) {
      toast.error("Revise os campos destacados antes de confirmar")
      return
    }
    if (items.length === 0) {
      toast.error("Adicione ao menos um item ao orçamento")
      return
    }
    try {
      const values = form.getValues()
      const quote = await createQuote.mutateAsync({ form: values, items })

      if (values.lock_type !== "none" && values.lock_value?.trim()) {
        try {
          await saveDeviceSecret.mutateAsync({
            orderType: "quote",
            orderId: quote.id,
            lockValue: values.lock_value.trim(),
          })
        } catch (secretError) {
          toast.warning("Orçamento criado, mas o dado de bloqueio não foi salvo com segurança", {
            description:
              secretError instanceof Error
                ? secretError.message
                : "Anote a senha/padrão manualmente por enquanto.",
          })
        }
      }

      if (values.send_whatsapp) {
        toast.info("Envio automático por WhatsApp entra numa fase futura — combine o envio manualmente por enquanto.")
      }
      toast.success("Orçamento criado com sucesso!")
      router.push(`/app/quotes/${quote.id}`)
    } catch (error) {
      toast.error("Não foi possível criar o orçamento", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  async function handleNext() {
    if (stepIndex === 0 && !form.getValues("client_id")) {
      toast.error("Selecione ou cadastre um cliente pra continuar")
      return
    }

    const fields = QUOTE_WIZARD_STEP_FIELDS[stepIndex] ?? []
    const valid = fields.length === 0 || (await form.trigger(fields))
    if (!valid) return

    if (stepIndex === STEPS.length - 1) {
      await handleFinish()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Novo Orçamento" description="Monte a proposta, passo a passo." />

      <Stepper steps={STEPS} onStepChange={setStepIndex}>
        <StepperHeader />

        <div className="border-border min-h-72 rounded-2xl border p-5">
          {/* Etapa 1 — Quem é o cliente? */}
          <Step index={0}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Quem é o cliente?</p>
              {selectedClient ? (
                <div className="border-border flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">{selectedClient.full_name}</p>
                    <p className="text-muted-foreground text-xs">{selectedClient.phone}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => form.setValue("client_id", null)}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      form.setValue("client_id", value)
                      form.setValue("client_device_id", null)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Buscar cliente por nome..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients ?? []).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} — {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ClientFormDialog
                    trigger={
                      <Button type="button" variant="outline" className="gap-2 self-start">
                        <Plus className="size-4" />
                        Cadastrar novo cliente
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </Step>

          {/* Etapa 2 — Qual o dispositivo? */}
          <Step index={1}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Qual o dispositivo?</p>

              {(clientDevices ?? []).length > 0 && (
                <div className="flex flex-col gap-2">
                  {clientDevices!.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => form.setValue("client_device_id", device.id)}
                      className={cn(
                        "border-border flex flex-col items-start rounded-xl border p-3 text-left transition-colors",
                        clientDeviceId === device.id && "border-primary bg-primary/5"
                      )}
                    >
                      <p className="text-foreground text-sm font-medium">
                        {device.brand} {device.model}
                      </p>
                      {device.serial_or_imei && (
                        <p className="text-muted-foreground text-xs">S/N: {device.serial_or_imei}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-border flex flex-col gap-3 rounded-xl border border-dashed p-3">
                <p className="text-muted-foreground text-xs font-medium">Ou adicione um novo aparelho</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Marca (ex: Apple)"
                    {...form.register("device_brand")}
                    onChange={(e) => {
                      form.setValue("device_brand", e.target.value)
                      form.setValue("client_device_id", null)
                    }}
                  />
                  <Input
                    placeholder="Modelo (ex: iPhone 12)"
                    {...form.register("device_model")}
                    onChange={(e) => {
                      form.setValue("device_model", e.target.value)
                      form.setValue("client_device_id", null)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Cor" {...form.register("device_color")} />
                  <Input placeholder="IMEI / série" {...form.register("device_serial_or_imei")} />
                </div>
              </div>
            </div>
          </Step>

          {/* Etapa 3 — Diagnóstico & Estado Físico */}
          <Step index={2}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Diagnóstico & Estado Físico</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Defeito relatado</label>
                <Textarea placeholder="Ex: tela quebrada após queda" {...form.register("reported_issue")} />
                {form.formState.errors.reported_issue && (
                  <p className="text-destructive text-xs">{form.formState.errors.reported_issue.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Acessórios deixados</label>
                <div className="flex flex-wrap gap-2">
                  {ACCESSORY_TAGS.map((tag) => (
                    <TagToggle
                      key={tag}
                      label={tag}
                      selected={accessoriesLeft.includes(tag)}
                      onToggle={() =>
                        form.setValue(
                          "accessories_left",
                          accessoriesLeft.includes(tag)
                            ? accessoriesLeft.filter((t) => t !== tag)
                            : [...accessoriesLeft, tag]
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Checklist físico</label>
                <div className="flex flex-wrap gap-2">
                  {PHYSICAL_CONDITION_TAGS.map((tag) => (
                    <TagToggle
                      key={tag}
                      label={tag}
                      selected={physicalTags.includes(tag)}
                      onToggle={() =>
                        form.setValue(
                          "physical_tags",
                          physicalTags.includes(tag)
                            ? physicalTags.filter((t) => t !== tag)
                            : [...physicalTags, tag]
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Laudo final (opcional)</label>
                <Textarea placeholder="Preenchido pelo técnico" {...form.register("technician_diagnosis")} />
              </div>

              <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
                <Camera className="text-muted-foreground size-5 shrink-0" />
                <span className="text-muted-foreground">
                  Upload de fotos entra numa fase futura (precisa de um projeto Supabase real conectado).
                </span>
              </div>
            </div>
          </Step>

          {/* Etapa 4 — Segurança do Dispositivo */}
          <Step index={3}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Segurança do Dispositivo</p>

              <Select value={lockType} onValueChange={(v) => form.setValue("lock_type", v as typeof lockType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem bloqueio</SelectItem>
                  <SelectItem value="password">Senha (numérica ou alfanumérica)</SelectItem>
                  <SelectItem value="pattern">Desenho (padrão)</SelectItem>
                </SelectContent>
              </Select>

              {lockType !== "none" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    {lockType === "pattern" ? "Descreva o padrão (ex: sequência de pontos 1-2-3-6-9)" : "Senha"}
                  </label>
                  <Input placeholder="Caso não tenha senha, deixe em branco" {...form.register("lock_value")} />
                </div>
              )}

              <div className="border-warning-bg bg-warning-bg text-warning flex items-start gap-2 rounded-xl border p-3 text-xs">
                <ShieldAlert className="size-4 shrink-0" />
                <span>
                  Esse dado é salvo de forma criptografada (nunca em texto plano) e só pode ser revelado depois pelo
                  técnico atribuído ou pelo dono da assistência. É apagado automaticamente 7 dias depois do orçamento
                  ser convertido em OS.
                </span>
              </div>
            </div>
          </Step>

          {/* Etapa 5 — Serviços e Valores */}
          <Step index={4}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Serviços e Valores</p>

              <ItemsFieldArray items={items} onItemsChange={setItems} />

              <div className="flex flex-col gap-1.5 sm:max-w-40">
                <label className="text-sm font-medium">Desconto (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.watch("discount_cents") / 100}
                  onChange={(e) => form.setValue("discount_cents", Math.round(Number(e.target.value) * 100) || 0)}
                />
              </div>

              <div className="border-border grid grid-cols-3 gap-3 rounded-xl border p-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Receita (Serviços/Produtos)</p>
                  <p className="text-foreground font-semibold">
                    {(subtotalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Previsto</p>
                  <p className="text-foreground font-semibold">
                    {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Desconto Aplicado</p>
                  <p className="text-foreground font-semibold">
                    {(form.watch("discount_cents") / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Recebido Por</label>
                  <Select
                    value={form.watch("received_by") ?? ""}
                    onValueChange={(v) => form.setValue("received_by", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Quem recebeu o aparelho" />
                    </SelectTrigger>
                    <SelectContent>
                      {(teamMembers ?? [])
                        .filter((member) => member.bancada_intake)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} {member.role === "owner" ? "· Proprietário" : "· Equipe"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Executor do Reparo</label>
                  <Select
                    value={form.watch("assigned_to") ?? ""}
                    onValueChange={(v) => form.setValue("assigned_to", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Quem vai executar" />
                    </SelectTrigger>
                    <SelectContent>
                      {(teamMembers ?? [])
                        .filter((member) => member.bancada_executor)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} {member.role === "owner" ? "· Proprietário" : "· Equipe"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Step>

          {/* Etapa 6 — Revisão Final */}
          <Step index={5}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Revisão final</p>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-foreground font-medium">{selectedClient?.full_name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aparelho</span>
                  <span className="text-foreground font-medium">
                    {form.watch("device_brand") || "—"} {form.watch("device_model")} {form.watch("device_color")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Defeito relatado</span>
                  <span className="text-foreground max-w-64 truncate text-right font-medium">
                    {form.watch("reported_issue") || "—"}
                  </span>
                </div>
                {physicalTags.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {physicalTags.map((tag) => (
                      <StatusBadge key={tag} tone="warning">
                        {tag}
                      </StatusBadge>
                    ))}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segurança</span>
                  <span className="text-foreground font-medium">
                    {lockType === "none"
                      ? "Sem bloqueio"
                      : `${lockType === "pattern" ? "Padrão" : "Senha"}: ${form.watch("lock_value") || "(em branco)"}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span className="text-foreground font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-foreground font-bold">
                    {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Observações</label>
                <Textarea placeholder="Opcional" {...form.register("notes")} />
              </div>

              <div className="border-border flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">Enviar por WhatsApp automaticamente</span>
                </div>
                <Switch
                  checked={form.watch("send_whatsapp")}
                  onCheckedChange={(v) => form.setValue("send_whatsapp", v)}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Ao confirmar, o cliente receberia automaticamente uma mensagem no WhatsApp com o número da proposta e
                o link de acompanhamento — o envio real ainda entra numa fase futura; por enquanto, combine com o
                cliente manualmente.
              </p>
            </div>
          </Step>
        </div>

        <StepperFooter onNext={handleNext} submitting={createQuote.isPending} finishLabel="Confirmar e Criar" />
      </Stepper>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="quotes">
      <NovoOrcamentoWizard />
    </ModuleGate>
  )
}
