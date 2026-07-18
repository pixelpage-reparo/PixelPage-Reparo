import { Gift, MessageCircleHeart, RefreshCcw, ShieldCheck } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"

const BONUSES = [
  {
    icon: ShieldCheck,
    title: "Configuração assistida",
    body: "No primeiro acesso, a gente te ajuda a cadastrar sua loja, sua equipe e seu primeiro produto. Sem enrolação.",
  },
  {
    icon: RefreshCcw,
    title: "Atualizações inclusas",
    body: "Todo recurso novo que a Bancada ganhar entra na sua assinatura, sem custo extra e sem letra miúda.",
  },
  {
    icon: MessageCircleHeart,
    title: "Suporte direto no WhatsApp",
    body: "Dúvida no sistema? Fala com gente de verdade, no mesmo WhatsApp que você já usa o dia inteiro.",
  },
]

export function BonusSection() {
  return (
    <SectionContainer tone="light">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow>
          <Gift className="size-3.5" />
          Bônus de quem entra agora
        </SectionEyebrow>
        <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Além do sistema, você ainda leva isso
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {BONUSES.map((bonus) => (
          <div key={bonus.title} className="border-border bg-card rounded-2xl border p-6 text-center">
            <span className="bg-primary/10 text-primary mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full">
              <bonus.icon className="size-5.5" strokeWidth={1.75} />
            </span>
            <h3 className="text-foreground text-base font-semibold">{bonus.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{bonus.body}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
