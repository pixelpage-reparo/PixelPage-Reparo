"use client"

import { useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { refreshProfile, useAuth } from "@/hooks/use-auth"
import {
  useMessageTemplates,
  usePaymentMethodFees,
  useUpdateCompany,
  useUpsertMessageTemplate,
  useUpsertPaymentMethodFee,
} from "@/hooks/queries/use-settings"

const GOAL_SHORTCUTS = [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000]

const TEMPLATE_DEFS = [
  { key: "os_status_received", label: "OS recebida" },
  { key: "os_status_ready_for_pickup", label: "OS pronta pra retirada" },
  { key: "os_status_delivered", label: "OS entregue" },
]

const PAYMENT_METHODS_FOR_FEES = ["pix", "debit", "credit"] as const

function DadosDaLojaTab() {
  const { company, session } = useAuth()
  const updateCompany = useUpdateCompany()
  const [name, setName] = useState(company?.name ?? "")
  const [logoUrl, setLogoUrl] = useState(company?.logo_url ?? "")
  const [whatsapp, setWhatsapp] = useState(company?.whatsapp_number ?? "")
  const [cep, setCep] = useState(company?.address_cep ?? "")
  const [street, setStreet] = useState(company?.address_street ?? "")
  const [number, setNumber] = useState(company?.address_number ?? "")
  const [neighborhood, setNeighborhood] = useState(company?.address_neighborhood ?? "")
  const [city, setCity] = useState(company?.address_city ?? "")
  const [state, setState] = useState(company?.address_state ?? "")

  async function handleSave() {
    try {
      await updateCompany.mutateAsync({
        name,
        logo_url: logoUrl || null,
        whatsapp_number: whatsapp || null,
        address_cep: cep || null,
        address_street: street || null,
        address_number: number || null,
        address_neighborhood: neighborhood || null,
        address_city: city || null,
        address_state: state || null,
      })
      if (session?.user) await refreshProfile(session.user.id)
      toast.success("Dados da loja atualizados")
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Nome Fantasia</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>URL do Logo</Label>
        <Input placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>WhatsApp de Contato</Label>
        <Input placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} />
        <Input className="sm:col-span-2" placeholder="Rua" value={street} onChange={(e) => setStreet(e.target.value)} />
        <Input placeholder="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
        <Input placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input placeholder="UF" value={state} onChange={(e) => setState(e.target.value)} />
      </div>
      <Button className="self-end" onClick={handleSave} disabled={updateCompany.isPending}>
        {updateCompany.isPending ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  )
}

function AparenciaTab() {
  const { company, session } = useAuth()
  const updateCompany = useUpdateCompany()
  const [primaryColor, setPrimaryColor] = useState(company?.primary_color ?? "#2563eb")
  const [language, setLanguage] = useState(company?.language ?? "pt-BR")
  const [currency, setCurrency] = useState(company?.currency ?? "BRL")

  async function handleSave() {
    try {
      await updateCompany.mutateAsync({ primary_color: primaryColor, language, currency })
      if (session?.user) await refreshProfile(session.user.id)
      toast.success("Aparência atualizada")
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Cor Principal da Marca</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="border-border size-9 rounded-lg border"
          />
          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="max-w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Idioma do Sistema</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Moeda</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (BRL)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="self-end" onClick={handleSave} disabled={updateCompany.isPending}>
        {updateCompany.isPending ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  )
}

function WhatsAppTab() {
  const { data: templates } = useMessageTemplates()
  const upsertTemplate = useUpsertMessageTemplate()

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-xs">
        Variáveis disponíveis: <code>{"{cliente}"}</code> <code>{"{os_id}"}</code> <code>{"{aparelho}"}</code>{" "}
        <code>{"{link_status_ao_vivo}"}</code>
      </p>
      {TEMPLATE_DEFS.map((def) => {
        const existing = templates?.find((t) => t.template_key === def.key)
        return (
          <TemplateEditor
            key={def.key}
            templateKey={def.key}
            label={def.label}
            initialBody={existing?.body ?? ""}
            onSave={(body) =>
              upsertTemplate.mutate({ template_key: def.key, channel: "whatsapp", body, is_active: true })
            }
          />
        )
      })}
    </div>
  )
}

function TemplateEditor({
  templateKey,
  label,
  initialBody,
  onSave,
}: {
  templateKey: string
  label: string
  initialBody: string
  onSave: (body: string) => void
}) {
  const [body, setBody] = useState(initialBody)

  return (
    <div className="border-border flex flex-col gap-2 rounded-xl border p-4">
      <Label htmlFor={templateKey}>{label}</Label>
      <Textarea
        id={templateKey}
        rows={3}
        placeholder="Ex: Olá {cliente}, sua OS #{os_id} está pronta!"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="bg-primary text-primary-foreground self-start rounded-2xl rounded-bl-sm px-3 py-2 text-xs">
        {body || "Preview da mensagem..."}
      </div>
      <Button size="sm" className="self-end" onClick={() => onSave(body)}>
        Salvar Modelo
      </Button>
    </div>
  )
}

function TermosTab() {
  const { company, session } = useAuth()
  const updateCompany = useUpdateCompany()
  const [warrantyText, setWarrantyText] = useState(company?.warranty_terms_text ?? "")
  const [retentionDays, setRetentionDays] = useState(company?.photo_retention_days ?? 365)

  const LEGAL_TEXT =
    "Este produto/serviço possui garantia conforme os artigos 18 e 26 do Código de Defesa do Consumidor (Lei nº 8.078/1990). " +
    "A garantia cobre defeitos relacionados exclusivamente ao serviço executado, não se estendendo a mau uso, quedas, contato com líquidos " +
    "ou intervenção de terceiros após a entrega."

  async function handleSave() {
    try {
      await updateCompany.mutateAsync({ warranty_terms_text: warrantyText, photo_retention_days: retentionDays })
      if (session?.user) await refreshProfile(session.user.id)
      toast.success("Termos atualizados")
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Termos de Garantia da OS</Label>
          <Button variant="outline" size="sm" onClick={() => setWarrantyText(LEGAL_TEXT)}>
            Usar Termo Jurídico Padrão
          </Button>
        </div>
        <Textarea rows={5} value={warrantyText} onChange={(e) => setWarrantyText(e.target.value)} />
        <p className="text-muted-foreground text-xs">{warrantyText.length} caracteres</p>
        <p className="text-muted-foreground text-xs">
          A garantia de vendas (Aparelhos) usa um texto separado, com prazo escolhido no fechamento da venda.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-56">
        <Label>Retenção de fotos (dias)</Label>
        <Input
          type="number"
          min={30}
          value={retentionDays}
          onChange={(e) => setRetentionDays(Number(e.target.value) || 0)}
        />
        <p className="text-muted-foreground text-xs">
          Fotos de OS são removidas automaticamente após esse prazo, com aviso 30 dias antes (LGPD).
        </p>
      </div>

      <Button className="self-end" onClick={handleSave} disabled={updateCompany.isPending}>
        {updateCompany.isPending ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  )
}

function MetasETaxasTab() {
  const { company, session } = useAuth()
  const updateCompany = useUpdateCompany()
  const [goalCents, setGoalCents] = useState(company?.daily_goal_cents ?? 0)
  const { data: fees } = usePaymentMethodFees()
  const upsertFee = useUpsertPaymentMethodFee()

  async function handleSaveGoal() {
    try {
      await updateCompany.mutateAsync({ daily_goal_cents: goalCents })
      if (session?.user) await refreshProfile(session.user.id)
      toast.success("Meta atualizada")
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  function feeFor(method: string, installments: number) {
    return fees?.find((f) => f.payment_method === method && f.installments === installments)?.fee_percent ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Meta de Faturamento Mensal (R$)</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_SHORTCUTS.map((cents) => (
            <Button key={cents} variant="outline" size="sm" onClick={() => setGoalCents(cents)}>
              {(cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          min={0}
          step="0.01"
          className="max-w-48"
          value={goalCents / 100}
          onChange={(e) => setGoalCents(Math.round(Number(e.target.value) * 100) || 0)}
        />
        <Button size="sm" className="self-end" onClick={handleSaveGoal} disabled={updateCompany.isPending}>
          Salvar meta
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Taxas de Pagamento (%)</Label>
        <div className="border-border overflow-hidden rounded-2xl border">
          <div className="divide-border flex flex-col divide-y">
            <div className="bg-muted/40 grid grid-cols-4 gap-2 px-3 py-2 text-xs font-semibold">
              <span>Forma</span>
              <span>Parcela</span>
              <span>Taxa (%)</span>
              <span></span>
            </div>
            {PAYMENT_METHODS_FOR_FEES.map((method) =>
              (method === "credit" ? [1, 2, 3, 6, 12] : [1]).map((installments) => (
                <FeeRow
                  key={`${method}-${installments}`}
                  method={method}
                  installments={installments}
                  value={feeFor(method, installments)}
                  onSave={(feePercent) =>
                    upsertFee.mutate({ payment_method: method, installments, fee_percent: feePercent })
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeeRow({
  method,
  installments,
  value,
  onSave,
}: {
  method: string
  installments: number
  value: number
  onSave: (fee: number) => void
}) {
  const [fee, setFee] = useState(value)
  const labels: Record<string, string> = { pix: "Pix", debit: "Débito", credit: "Crédito" }

  return (
    <div className="grid grid-cols-4 items-center gap-2 px-3 py-2 text-sm">
      <span className="text-foreground">{labels[method]}</span>
      <span className="text-muted-foreground">{installments}x</span>
      <Input
        type="number"
        min={0}
        step="0.01"
        className="h-8 max-w-24"
        value={fee}
        onChange={(e) => setFee(Number(e.target.value) || 0)}
      />
      <Button variant="ghost" size="sm" onClick={() => onSave(fee)}>
        Salvar
      </Button>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Minha Assistência" description="Dados da loja, aparência, WhatsApp, termos e metas." />

      <Tabs defaultValue="store">
        <TabsList className="flex-wrap">
          <TabsTrigger value="store">Dados da Loja</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="terms">Termos</TabsTrigger>
          <TabsTrigger value="goals">Metas & Taxas</TabsTrigger>
        </TabsList>
        <TabsContent value="store" className="mt-4">
          <DadosDaLojaTab />
        </TabsContent>
        <TabsContent value="appearance" className="mt-4">
          <AparenciaTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-4">
          <WhatsAppTab />
        </TabsContent>
        <TabsContent value="terms" className="mt-4">
          <TermosTab />
        </TabsContent>
        <TabsContent value="goals" className="mt-4">
          <MetasETaxasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="settings">
      <SettingsPage />
    </ModuleGate>
  )
}
