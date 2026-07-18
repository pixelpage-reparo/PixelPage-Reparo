import { ArrowRight, PiggyBank, PlayCircle, Star, Target, Wallet, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BrowserFrame } from "@/components/shared/frames/BrowserFrame"
import { StatCard } from "@/components/shared/StatCard"
import { KanbanCard } from "@/components/app/Kanban/KanbanCard"
import { StatusBadge } from "@/components/shared/StatusBadge"

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="bg-primary/10 pointer-events-none absolute top-0 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <span className="bg-primary/10 text-primary mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Wrench className="size-3.5" />
          Feito pra assistência técnica
        </span>

        <h1 className="text-foreground mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Sua bancada organizada.{" "}
          <span className="text-brand-gradient">Seu bolso, em dia.</span>
        </h1>

        <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-balance">
          OS, estoque e caixa num só lugar — sincronizado no celular, no tablet e no
          computador, em tempo real. Sem caderno, sem planilha, sem "vou ver depois".
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-12 gap-2 px-6 text-base" asChild>
            <a href="#planos">
              Testar grátis por 7 dias
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2 px-6 text-base" asChild>
            <a href="#recursos">
              <PlayCircle className="size-4" />
              Ver como funciona
            </a>
          </Button>
        </div>

        <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="fill-warning text-warning size-4" />
            ))}
          </div>
          <span>4,9/5 com mais de 800 assistências técnicas usando todo dia</span>
        </div>

        <div className="mt-16">
          <BrowserFrame url="app.bancada.com.br/dashboard" className="mx-auto max-w-4xl text-left">
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-6">
              <StatCard
                label="Faturamento hoje"
                value="R$ 1.284"
                icon={Wallet}
                tone="success"
                trend={{ value: "+18%", direction: "up" }}
              />
              <StatCard label="Meta do dia" value="82%" icon={Target} />
              <StatCard label="Margem bruta" value="46%" icon={PiggyBank} tone="success" />
              <StatCard label="OS em aberto" value="12" icon={Wrench} tone="warning" />
            </div>
            <div className="hidden gap-3 px-4 pb-6 sm:grid sm:grid-cols-3 sm:px-6">
              <KanbanCard className="cursor-default">
                <StatusBadge tone="muted">Recebido</StatusBadge>
                <p className="text-sm font-medium">iPhone 12 — Tela</p>
                <p className="text-muted-foreground text-xs">Marcos Silva</p>
              </KanbanCard>
              <KanbanCard className="cursor-default">
                <StatusBadge tone="warning">Aguardando peça</StatusBadge>
                <p className="text-sm font-medium">Galaxy S21 — Bateria</p>
                <p className="text-muted-foreground text-xs">Juliana Prado</p>
              </KanbanCard>
              <KanbanCard className="cursor-default">
                <StatusBadge tone="success">Pronto pra retirada</StatusBadge>
                <p className="text-sm font-medium">iPad 9 — Conector</p>
                <p className="text-muted-foreground text-xs">Renato Alves</p>
              </KanbanCard>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  )
}
