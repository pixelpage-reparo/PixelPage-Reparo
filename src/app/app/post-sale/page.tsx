"use client"

import { BadgeCheck, Cake, MessageCircle, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { refreshProfile, useAuth } from "@/hooks/use-auth"
import { useClients } from "@/hooks/queries/use-clients"
import { useMessageTemplates, useUpdateCompany, useUpsertMessageTemplate } from "@/hooks/queries/use-settings"
import { useServiceOrders } from "@/hooks/queries/use-service-orders"
import { daysUntilNextBirthday } from "@/lib/utils"

function ReputacaoTab() {
  const { company, session } = useAuth()
  const updateCompany = useUpdateCompany()
  const [reviewUrl, setReviewUrl] = useState(company?.google_review_url ?? "")
  const { data: templates } = useMessageTemplates()
  const upsertTemplate = useUpsertMessageTemplate()
  const [body, setBody] = useState(templates?.find((t) => t.template_key === "google_review_request")?.body ?? "")
  const { data: serviceOrders } = useServiceOrders()
  const { data: clients } = useClients()

  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients ?? []) map.set(c.id, c.full_name)
    return map
  }, [clients])

  const recentDelivered = (serviceOrders ?? [])
    .filter((o) => o.status === "delivered" && o.delivered_at)
    .filter((o) => (Date.now() - new Date(o.delivered_at!).getTime()) / 86_400_000 <= 15)

  async function handleSaveUrl() {
    try {
      await updateCompany.mutateAsync({ google_review_url: reviewUrl || null })
      if (session?.user) await refreshProfile(session.user.id)
      toast.success("Link salvo")
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>Link de avaliação do Google Meu Negócio</Label>
        <div className="flex gap-2">
          <Input placeholder="https://g.page/r/..." value={reviewUrl} onChange={(e) => setReviewUrl(e.target.value)} />
          <Button onClick={handleSaveUrl} disabled={updateCompany.isPending}>
            Salvar
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">Enviado automaticamente no pedido de avaliação.</p>
      </div>

      <div className="border-border flex flex-col gap-2 rounded-xl border p-4">
        <Label>Modelo de mensagem</Label>
        <Textarea
          rows={3}
          placeholder="Ex: Oi {nome}, tudo certo com seu {aparelho}? Deixe sua avaliação: ..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="bg-primary text-primary-foreground self-start rounded-2xl rounded-bl-sm px-3 py-2 text-xs">
          {body || "Preview da mensagem..."}
        </div>
        <Button
          size="sm"
          className="self-end"
          onClick={() =>
            upsertTemplate.mutate({ template_key: "google_review_request", channel: "whatsapp", body, is_active: true })
          }
        >
          Salvar Modelo
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-sm font-semibold">Serviços para Pós-Venda (últimos 15 dias)</p>
        {recentDelivered.length === 0 ? (
          <EmptyState icon={Star} title="Nada por aqui ainda" description="OS entregues recentemente aparecem aqui." />
        ) : (
          <div className="flex flex-col divide-y">
            {recentDelivered.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-foreground font-medium">
                    {order.client_id ? (clientsById.get(order.client_id) ?? "Cliente") : "Sem cliente"}
                  </p>
                  <p className="text-muted-foreground text-xs">OS #{order.os_number}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" disabled={!reviewUrl}>
                  <MessageCircle className="size-3.5" />
                  Pedir avaliação
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AniversariosTab() {
  const { data: clients } = useClients()
  const { data: templates } = useMessageTemplates()
  const upsertTemplate = useUpsertMessageTemplate()
  const [body, setBody] = useState(templates?.find((t) => t.template_key === "birthday")?.body ?? "")
  const [windowDays, setWindowDays] = useState(30)

  const withBirthdays = useMemo(() => {
    return (clients ?? [])
      .filter((c) => c.birth_date)
      .map((c) => ({ client: c, daysUntil: daysUntilNextBirthday(c.birth_date!) }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [clients])

  const inWindow = withBirthdays.filter((c) => c.daysUntil <= windowDays)
  const today = withBirthdays.filter((c) => c.daysUntil === 0).length
  const in7Days = withBirthdays.filter((c) => c.daysUntil <= 7).length
  const in30Days = withBirthdays.filter((c) => c.daysUntil <= 30).length

  return (
    <div className="flex flex-col gap-5">
      <div className="border-border flex flex-col gap-2 rounded-xl border p-4">
        <Label>Mensagem de Aniversário</Label>
        <Textarea
          rows={3}
          placeholder="Ex: Parabéns, {nome}! A equipe da {loja} deseja um ótimo dia!"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="bg-primary text-primary-foreground self-start rounded-2xl rounded-bl-sm px-3 py-2 text-xs">
          {body || "Preview da mensagem..."}
        </div>
        <Button
          size="sm"
          className="self-end"
          onClick={() => upsertTemplate.mutate({ template_key: "birthday", channel: "whatsapp", body, is_active: true })}
        >
          Salvar Modelo
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Hoje" value={String(today)} tone="success" />
        <StatCard label="7 Dias" value={String(in7Days)} />
        <StatCard label="30 Dias" value={String(in30Days)} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm font-semibold">Aniversariantes</p>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={windowDays === d ? "default" : "outline"} onClick={() => setWindowDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {inWindow.length === 0 ? (
        <EmptyState icon={Cake} title="Nenhum aniversariante nessa janela" description="Cadastre a data de nascimento na ficha do cliente." />
      ) : (
        <div className="flex flex-col divide-y">
          {inWindow.map(({ client, daysUntil }) => (
            <div key={client.id} className="flex items-center justify-between py-2 text-sm">
              <p className="text-foreground font-medium">{client.full_name}</p>
              <StatusBadge tone={daysUntil === 0 ? "success" : "muted"}>
                {daysUntil === 0 ? "Hoje!" : `em ${daysUntil} dias`}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GarantiaTab() {
  const { data: serviceOrders, isLoading } = useServiceOrders()
  const [tab, setTab] = useState<"all" | "active" | "expiring" | "expired">("all")

  const warranties = useMemo(() => {
    return (serviceOrders ?? [])
      .filter((o) => o.status === "delivered" && o.delivered_at)
      .map((o) => {
        const expiresAt = new Date(o.delivered_at!)
        expiresAt.setDate(expiresAt.getDate() + o.warranty_days)
        const daysLeft = Math.round((expiresAt.getTime() - Date.now()) / 86_400_000)
        const status = daysLeft < 0 ? "expired" : daysLeft <= 15 ? "expiring" : "active"
        return { order: o, expiresAt, daysLeft, status }
      })
  }, [serviceOrders])

  const active = warranties.filter((w) => w.status === "active").length
  const expiring = warranties.filter((w) => w.status === "expiring").length
  const expired = warranties.filter((w) => w.status === "expired").length
  const filtered = tab === "all" ? warranties : warranties.filter((w) => w.status === tab)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Garantias Ativas" value={String(active)} tone="success" />
        <StatCard label="Expirando em Breve" value={String(expiring)} tone="warning" />
        <StatCard label="Expiradas (30d)" value={String(expired)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Ativas</TabsTrigger>
          <TabsTrigger value="expiring">Expirando</TabsTrigger>
          <TabsTrigger value="expired">Expiradas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="Nenhuma garantia aqui" description="Garantias são geradas automaticamente a partir de OS entregues." />
      ) : (
        <div className="flex flex-col divide-y">
          {filtered.map(({ order, expiresAt, status }) => (
            <div key={order.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-foreground font-medium">OS #{order.os_number}</p>
                <p className="text-muted-foreground text-xs">Expira em {expiresAt.toLocaleDateString("pt-BR")}</p>
              </div>
              <StatusBadge tone={status === "active" ? "success" : status === "expiring" ? "warning" : "destructive"}>
                {status === "active" ? "Ativa" : status === "expiring" ? "Expirando" : "Expirada"}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PostSalePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Pós-Venda & Reputação" description="Avaliações, aniversários e garantias, num só lugar." />

      <Tabs defaultValue="reputation">
        <TabsList>
          <TabsTrigger value="reputation" className="gap-1.5">
            <Star className="size-3.5" />
            Reputação Google
          </TabsTrigger>
          <TabsTrigger value="birthdays" className="gap-1.5">
            <Cake className="size-3.5" />
            Aniversários
          </TabsTrigger>
          <TabsTrigger value="warranty" className="gap-1.5">
            <BadgeCheck className="size-3.5" />
            Garantia
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reputation" className="mt-4">
          <ReputacaoTab />
        </TabsContent>
        <TabsContent value="birthdays" className="mt-4">
          <AniversariosTab />
        </TabsContent>
        <TabsContent value="warranty" className="mt-4">
          <GarantiaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="post_sale">
      <PostSalePage />
    </ModuleGate>
  )
}
