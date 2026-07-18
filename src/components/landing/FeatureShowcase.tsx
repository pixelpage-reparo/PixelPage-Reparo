import {
  BadgeCheck,
  CircleDollarSign,
  Wallet,
} from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"
import { FeatureBlock } from "@/components/landing/FeatureBlock"
import { BrowserFrame } from "@/components/shared/frames/BrowserFrame"
import { PhoneFrame } from "@/components/shared/frames/PhoneFrame"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { KanbanColumn } from "@/components/app/Kanban/KanbanColumn"
import { KanbanCard } from "@/components/app/Kanban/KanbanCard"
import { KanbanBoard } from "@/components/app/Kanban/KanbanBoard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

function OsDigitalMockup() {
  return (
    <BrowserFrame url="app.bancada.com.br/service-orders">
      <div className="p-4">
        <KanbanBoard className="pointer-events-none">
          <KanbanColumn title="Diagnóstico" count={2} accentClassName="bg-chart-1">
            <KanbanCard>
              <StatusBadge tone="default">Diagnóstico</StatusBadge>
              <p className="text-sm font-medium">iPhone 12 — Tela</p>
              <p className="text-muted-foreground text-xs">Marcos Silva</p>
            </KanbanCard>
          </KanbanColumn>
          <KanbanColumn title="Em reparo" count={1} accentClassName="bg-chart-3">
            <KanbanCard>
              <StatusBadge tone="warning">Em reparo</StatusBadge>
              <p className="text-sm font-medium">Galaxy S21 — Bateria</p>
              <p className="text-muted-foreground text-xs">Juliana Prado</p>
            </KanbanCard>
          </KanbanColumn>
          <KanbanColumn title="Pronto" count={1} accentClassName="bg-success">
            <KanbanCard>
              <StatusBadge tone="success">Pronto pra retirada</StatusBadge>
              <p className="text-sm font-medium">iPad 9 — Conector</p>
              <p className="text-muted-foreground text-xs">Renato Alves</p>
            </KanbanCard>
          </KanbanColumn>
        </KanbanBoard>
      </div>
    </BrowserFrame>
  )
}

function CrmMockup() {
  const clients = [
    { name: "Marcos Silva", phone: "(19) 99888-2231", total: "R$ 640" },
    { name: "Juliana Prado", phone: "(41) 99123-4455", total: "R$ 1.180" },
    { name: "Renato Alves", phone: "(71) 98877-1122", total: "R$ 320" },
  ]
  return (
    <BrowserFrame url="app.bancada.com.br/clients">
      <div className="flex flex-col divide-y">
        {clients.map((c) => (
          <div key={c.name} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">{c.name}</p>
              <p className="text-muted-foreground text-xs">{c.phone}</p>
            </div>
            <span className="text-success text-sm font-semibold">{c.total}</span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  )
}

function InventoryMockup() {
  const items = [
    { name: "Tela iPhone 12", qty: 2, tone: "warning" as const },
    { name: "Bateria Galaxy S21", qty: 0, tone: "destructive" as const },
    { name: "Conector de carga iPad", qty: 14, tone: "success" as const },
  ]
  return (
    <BrowserFrame url="app.bancada.com.br/inventory">
      <div className="flex flex-col divide-y">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between px-4 py-3">
            <p className="text-foreground text-sm font-medium">{item.name}</p>
            <StatusBadge tone={item.tone}>
              {item.qty === 0 ? "Sem estoque" : `${item.qty} un.`}
            </StatusBadge>
          </div>
        ))}
      </div>
    </BrowserFrame>
  )
}

function FinanceMockup() {
  return (
    <BrowserFrame url="app.bancada.com.br/finance">
      <div className="grid grid-cols-2 gap-3 p-4">
        <StatCard label="Entradas do mês" value="R$ 18.420" icon={Wallet} tone="success" />
        <StatCard label="Lucro líquido" value="R$ 7.960" icon={CircleDollarSign} tone="success" />
      </div>
      <div className="flex items-end gap-2 px-4 pb-4">
        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
          <div key={i} className="bg-primary/70 flex-1 rounded-t-sm" style={{ height: `${h}px` }} />
        ))}
      </div>
    </BrowserFrame>
  )
}

function TeamMockup() {
  const modules = [
    { name: "Ordens de Serviço", on: true },
    { name: "Estoque", on: true },
    { name: "Financeiro", on: false },
    { name: "PDV", on: true },
  ]
  return (
    <BrowserFrame url="app.bancada.com.br/team">
      <div className="flex flex-col divide-y">
        {modules.map((m) => (
          <div key={m.name} className="flex items-center justify-between px-4 py-3">
            <p className="text-foreground text-sm font-medium">{m.name}</p>
            <Switch checked={m.on} className="pointer-events-none" />
          </div>
        ))}
      </div>
    </BrowserFrame>
  )
}

function PosMockup() {
  const items = [
    { name: "Película 3D", qty: 1, price: "R$ 35" },
    { name: "Capinha transparente", qty: 2, price: "R$ 58" },
  ]
  return (
    <BrowserFrame url="app.bancada.com.br/pos">
      <div className="flex flex-col divide-y">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-foreground text-sm font-medium">{item.name}</p>
              <p className="text-muted-foreground text-xs">{item.qty}x</p>
            </div>
            <span className="text-foreground text-sm font-semibold">{item.price}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-foreground text-sm font-bold">Total</span>
          <span className="text-success text-sm font-bold">R$ 93</span>
        </div>
      </div>
    </BrowserFrame>
  )
}

function PremiumOsMockup() {
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-brand-gradient size-6 rounded-md" />
          <span className="text-foreground text-xs font-bold">Sua Assistência LTDA</span>
        </div>
        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          Ordem de Serviço #1042
        </p>
        <div className="border-border mt-2 flex flex-col gap-1.5 border-b pb-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Troca de tela</span>
            <span className="text-foreground">R$ 280</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mão de obra</span>
            <span className="text-foreground">R$ 60</span>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold">
          <span>Total</span>
          <span>R$ 340</span>
        </div>
        <p className="text-muted-foreground mt-4 text-[10px] leading-relaxed">
          Garantia de 90 dias para peças e serviço. Termo assinado digitalmente pelo cliente.
        </p>
      </div>
    </PhoneFrame>
  )
}

function ShowcaseMockup() {
  const devices = [
    { name: "iPhone 11 128GB", price: "R$ 1.899" },
    { name: "Galaxy A54 lacrado", price: "R$ 1.299" },
  ]
  return (
    <BrowserFrame url="bancada.com.br/vitrine/sua-loja">
      <div className="grid grid-cols-2 gap-3 p-4">
        {devices.map((d) => (
          <div key={d.name} className="border-border rounded-xl border p-3">
            <div className="bg-muted mb-2 aspect-square rounded-lg" />
            <p className="text-foreground text-xs font-medium">{d.name}</p>
            <p className="text-primary text-sm font-bold">{d.price}</p>
            <span className="bg-success-bg text-success mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
              <BadgeCheck className="size-3" />
              IMEI verificado
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  )
}

const FEATURES = [
  {
    eyebrow: "OS Digital",
    eyebrowClassName: "bg-chart-1/10 text-chart-1",
    title: "Chega de discussão com o cliente.",
    description:
      "Diagnóstico registrado com foto e checklist na hora da entrada. Ninguém depende da memória de ninguém — nem você, nem o cliente.",
    bullets: [
      "Checklist de tela, câmera, áudio e conectividade",
      "Fotos anexadas em cada etapa do reparo",
      "Assinatura digital na entrega",
    ],
    mockup: <OsDigitalMockup />,
  },
  {
    eyebrow: "CRM",
    eyebrowClassName: "bg-success-bg text-success",
    title: "Cada cliente, um histórico completo.",
    description:
      "Aparelho, conserto anterior, quanto já gastou com você — tudo num toque, sem precisar perguntar de novo.",
    bullets: [
      "Busca por nome ou telefone em segundos",
      "Histórico de aparelhos por cliente",
      "Total gasto sempre visível",
    ],
    mockup: <CrmMockup />,
  },
  {
    eyebrow: "Estoque",
    eyebrowClassName: "bg-warning-bg text-warning",
    title: "Baixa automática. Peça não some mais.",
    description:
      "Usou a peça na OS, o estoque já desconta sozinho. E quando tá acabando, o sistema avisa antes de faltar de verdade.",
    bullets: [
      "Baixa no exato momento do uso",
      "Alerta de estoque baixo automático",
      "Nunca deixa vender o que não tem",
    ],
    mockup: <InventoryMockup />,
  },
  {
    eyebrow: "Financeiro",
    eyebrowClassName: "bg-success-bg text-success",
    title: "Cabeça livre na hora de dormir.",
    description:
      "Saiba o que entrou, o que saiu e quanto sobrou — sem abrir planilha, sem contar nota por nota.",
    bullets: [
      "Fluxo de caixa diário e mensal",
      "Fechamento por Pix, cartão e dinheiro",
      "Margem e lucro sempre à vista",
    ],
    mockup: <FinanceMockup />,
  },
  {
    eyebrow: "Equipe",
    eyebrowClassName: "bg-chart-4/10 text-chart-4",
    title: "Sua equipe no sistema. Você no controle.",
    description:
      "Cada funcionário só enxerga o que você libera. Financeiro? Assunto do dono, por padrão.",
    bullets: [
      "Permissão liga/desliga por módulo",
      "Toda ação registrada com nome e horário",
      "Financeiro fica travado até você liberar",
    ],
    mockup: <TeamMockup />,
  },
  {
    eyebrow: "PDV",
    eyebrowClassName: "bg-chart-5/10 text-chart-5",
    title: "Venda de balcão sem sistema paralelo.",
    description:
      "Vendeu uma capinha ou uma película? Lança na hora, vinculado ou não a uma OS. O caixa fecha batendo, todo dia.",
    bullets: [
      "Venda avulsa ou junto com a OS",
      "Pix, cartão e dinheiro separados",
      "Fecha o dia com um clique",
    ],
    mockup: <PosMockup />,
  },
  {
    eyebrow: "OS Premium",
    eyebrowClassName: "bg-primary/10 text-primary",
    title: "Documento com a sua marca. Não a nossa.",
    description:
      "Seu cliente recebe um orçamento e um termo de garantia com a identidade da sua loja — logo, cores, tudo.",
    bullets: [
      "Logo e cor da sua loja em todo documento",
      "Valor em real, dólar ou euro",
      "Garantia no papel, sem letra miúda",
    ],
    mockup: <PremiumOsMockup />,
  },
  {
    eyebrow: "Vitrine",
    eyebrowClassName: "bg-chart-5/10 text-chart-5",
    title: "Seminovos com IMEI, sem parecer picareta.",
    description:
      "Publique aparelhos de revenda com fotos e IMEI verificado. Sua loja vira uma vitrine aberta 24 horas.",
    bullets: [
      "Catálogo público com fotos",
      "Selo de IMEI verificado",
      "Liga e desliga cada anúncio quando quiser",
    ],
    mockup: <ShowcaseMockup />,
  },
]

export function FeatureShowcase() {
  return (
    <SectionContainer id="recursos" tone="light">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow>Tudo o que a bancada precisa</SectionEyebrow>
        <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Cada função existe pra resolver uma dor que você sente todo dia
        </h2>
      </div>

      <div className="mt-4 divide-y">
        {FEATURES.map((feature, i) => (
          <FeatureBlock
            key={feature.title}
            eyebrow={feature.eyebrow}
            eyebrowClassName={feature.eyebrowClassName}
            title={feature.title}
            description={feature.description}
            bullets={feature.bullets}
            align={i % 2 === 0 ? "left" : "right"}
            mockup={feature.mockup}
          />
        ))}
      </div>
    </SectionContainer>
  )
}
