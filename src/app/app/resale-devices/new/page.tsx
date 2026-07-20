"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { PageHeader } from "@/components/shared/PageHeader"
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
import { useCreateResaleDevice } from "@/hooks/queries/use-showcase"
import { RESALE_CONDITION_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  ACCOMPANYING_ITEM_TAGS,
  resaleDeviceWizardSchema,
  type ResaleDeviceWizardValues,
} from "@/lib/validators/showcase.schema"

const STEPS = [
  { id: "type", label: "Tipo" },
  { id: "identification", label: "Identificação" },
  { id: "condition", label: "Estado" },
  { id: "photos", label: "Fotos" },
  { id: "source", label: "Origem" },
  { id: "price", label: "Preço" },
  { id: "stock", label: "Estoque" },
]

const BRAND_SHORTCUTS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Realme"]
const STORAGE_SHORTCUTS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"]

function AparelhoWizard() {
  const router = useRouter()
  const createDevice = useCreateResaleDevice()
  const [stepIndex, setStepIndex] = useState(0)

  const form = useForm<ResaleDeviceWizardValues>({
    resolver: zodResolver(resaleDeviceWizardSchema),
    defaultValues: {
      device_type: "seminovo",
      brand: "",
      model: "",
      color: "",
      storage_capacity: "",
      imei: "",
      condition: "used_excellent",
      description: "",
      accompanying_items: [],
      acquisition_source: null,
      acquisition_source_name: "",
      cost_cents: 0,
      repair_cost_cents: 0,
      price_cents: 0,
      min_price_cents: null,
      warranty_months: 0,
      status: "available",
      is_public: false,
      physical_location: "",
    },
  })

  const deviceType = form.watch("device_type")
  const accompanyingItems = form.watch("accompanying_items")
  const acquisitionSource = form.watch("acquisition_source")

  async function handleFinish() {
    const valid = await form.trigger()
    if (!valid) {
      toast.error("Revise os campos destacados antes de salvar")
      return
    }
    try {
      const { device_type: _deviceType, ...values } = form.getValues()
      await createDevice.mutateAsync(values)
      toast.success("Aparelho cadastrado!")
      router.push(`/app/resale-devices`)
    } catch (error) {
      toast.error("Não foi possível salvar o aparelho", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  async function handleNext() {
    if (stepIndex === STEPS.length - 1) {
      await handleFinish()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Cadastrar Aparelho" description="Seminovos, lacrados e usados — passo a passo." />

      <Stepper steps={STEPS} onStepChange={setStepIndex}>
        <StepperHeader />

        <div className="border-border min-h-72 rounded-2xl border p-5">
          {/* Etapa 1 — Tipo */}
          <Step index={0}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Que tipo de aparelho é esse?</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { value: "seminovo" as const, label: "Seminovo", desc: "Usado em bom estado, revisado" },
                    { value: "lacrado" as const, label: "Lacrado", desc: "Novo na caixa, cadastro rápido" },
                    { value: "usado" as const, label: "Usado", desc: "Com marcas de uso ou aguardando revisão" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue("device_type", opt.value)}
                    className={cn(
                      "border-border flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                      deviceType === opt.value && "border-primary bg-primary/5"
                    )}
                  >
                    <span className="text-foreground text-sm font-medium">{opt.label}</span>
                    <span className="text-muted-foreground text-xs">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Se for compra de cliente (trade-in), use a ação &quot;Comprar de Cliente&quot; na Visão Geral — ela já
                gera recibo e checklist automaticamente.
              </p>
            </div>
          </Step>

          {/* Etapa 2 — Identificação */}
          <Step index={1}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Identificação do aparelho</p>

              <div className="flex flex-wrap gap-2">
                {BRAND_SHORTCUTS.map((brand) => (
                  <TagToggle
                    key={brand}
                    label={brand}
                    selected={form.watch("brand") === brand}
                    onToggle={() => form.setValue("brand", brand)}
                  />
                ))}
              </div>
              <Input placeholder="Marca (ou digite outra)" {...form.register("brand")} />
              <Input placeholder="Modelo*" {...form.register("model")} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Cor" {...form.register("color")} />
                <div className="flex flex-wrap gap-1.5">
                  {STORAGE_SHORTCUTS.map((size) => (
                    <TagToggle
                      key={size}
                      label={size}
                      selected={form.watch("storage_capacity") === size}
                      onToggle={() => form.setValue("storage_capacity", size)}
                    />
                  ))}
                </div>
              </div>

              <Input placeholder="IMEI 1" {...form.register("imei")} />
              <p className="text-muted-foreground text-xs">
                O IMEI identifica este aparelho no estoque, na venda e na garantia. Disque *#06# para encontrar.
              </p>
            </div>
          </Step>

          {/* Etapa 3 — Estado */}
          <Step index={2}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Estado do aparelho</p>
              <Select value={form.watch("condition")} onValueChange={(v) => form.setValue("condition", v as never)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESALE_CONDITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Observações (opcional)" {...form.register("description")} />
            </div>
          </Step>

          {/* Etapa 4 — Fotos + o que acompanha */}
          <Step index={3}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Fotos e o que acompanha</p>
              <div className="border-border bg-muted/40 rounded-xl border border-dashed p-4 text-center text-sm">
                <p className="text-muted-foreground">
                  Upload de fotos entra numa fase futura (precisa de um projeto Supabase real conectado).
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">O que acompanha o aparelho</label>
                <div className="flex flex-wrap gap-2">
                  {ACCOMPANYING_ITEM_TAGS.map((tag) => (
                    <TagToggle
                      key={tag}
                      label={tag}
                      selected={accompanyingItems.includes(tag)}
                      onToggle={() =>
                        form.setValue(
                          "accompanying_items",
                          accompanyingItems.includes(tag)
                            ? accompanyingItems.filter((t) => t !== tag)
                            : [...accompanyingItems, tag]
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Step>

          {/* Etapa 5 — De onde veio */}
          <Step index={4}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">De onde veio este aparelho?</p>
              <Select
                value={acquisitionSource ?? ""}
                onValueChange={(v) => form.setValue("acquisition_source", v as never)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="comprado_de_cliente">Comprado de Cliente</SelectItem>
                  <SelectItem value="recebido_em_troca">Recebido em Troca</SelectItem>
                  <SelectItem value="estoque_proprio">Estoque Próprio</SelectItem>
                  <SelectItem value="consignado">Consignado</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Nome do fornecedor/consignante (opcional)" {...form.register("acquisition_source_name")} />

              <p className="text-foreground text-sm font-semibold">Quanto custou?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Custo de aquisição (R$)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.watch("cost_cents") / 100}
                    onChange={(e) => form.setValue("cost_cents", Math.round(Number(e.target.value) * 100) || 0)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Custo de revisão/reparo (R$)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.watch("repair_cost_cents") / 100}
                    onChange={(e) =>
                      form.setValue("repair_cost_cents", Math.round(Number(e.target.value) * 100) || 0)
                    }
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Esse custo entra automaticamente como despesa no financeiro numa fase futura.
              </p>
            </div>
          </Step>

          {/* Etapa 6 — Preço e garantia */}
          <Step index={5}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Por quanto vai vender</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Preço anunciado (público)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.watch("price_cents") / 100}
                    onChange={(e) => form.setValue("price_cents", Math.round(Number(e.target.value) * 100) || 0)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Preço mínimo (só a equipe vê)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={(form.watch("min_price_cents") ?? 0) / 100}
                    onChange={(e) =>
                      form.setValue("min_price_cents", Math.round(Number(e.target.value) * 100) || 0)
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:max-w-48">
                <label className="text-sm font-medium">Garantia oferecida (meses)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.watch("warranty_months")}
                  onChange={(e) => form.setValue("warranty_months", Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </Step>

          {/* Etapa 7 — Estoque e localização */}
          <Step index={6}>
            <div className="flex flex-col gap-4">
              <p className="text-foreground text-sm font-semibold">Como este aparelho entra no estoque</p>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as never)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">Em Revisão</SelectItem>
                  <SelectItem value="available">Pronto — revisado, ainda não anunciado</SelectItem>
                </SelectContent>
              </Select>

              <div className="border-border flex items-center justify-between rounded-xl border p-3">
                <span className="text-sm font-medium">Anunciado — disponível na vitrine agora</span>
                <Switch checked={form.watch("is_public")} onCheckedChange={(v) => form.setValue("is_public", v)} />
              </div>

              <Input placeholder="Localização física (ex: Gaveta 2, Vitrine Principal)" {...form.register("physical_location")} />

              <div className="border-border bg-muted/40 flex flex-col gap-1 rounded-xl border p-4 text-sm">
                <p className="text-foreground font-medium">
                  {form.watch("brand")} {form.watch("model")} — {form.watch("imei") || "sem IMEI"}
                </p>
                <p className="text-muted-foreground text-xs">
                  Custo total:{" "}
                  {((form.watch("cost_cents") + form.watch("repair_cost_cents")) / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  · Preço anunciado:{" "}
                  {(form.watch("price_cents") / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          </Step>
        </div>

        <StepperFooter onNext={handleNext} submitting={createDevice.isPending} finishLabel="Salvar Aparelho" />
      </Stepper>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="resale_devices">
      <AparelhoWizard />
    </ModuleGate>
  )
}
