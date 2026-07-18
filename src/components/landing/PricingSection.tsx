import { Check, Lock } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FEATURES = [
  "Ordens de serviço ilimitadas",
  "Clientes e histórico de aparelhos ilimitados",
  "Estoque com baixa automática",
  "Financeiro completo com fechamento de caixa",
  "Até 5 funcionários com permissão por módulo",
  "PDV integrado à OS",
  "Vitrine pública de revenda",
  "Suporte direto pelo WhatsApp",
]

export function PricingSection() {
  return (
    <SectionContainer id="planos" tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow tone="dark">Preço de lançamento</SectionEyebrow>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Trave esse valor agora. Ele só sobe depois.
        </h2>
        <p className="text-navy-muted-foreground mt-4 text-base">
          Quem entra durante o lançamento carrega esse preço pra sempre. Quem chegar depois, paga o valor cheio.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="border-primary bg-navy-card relative rounded-2xl border-2 p-8">
          <span className="bg-primary absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-bold text-white">
            Preço travado
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">R$ 47</span>
            <span className="text-navy-muted-foreground text-sm">/mês</span>
          </div>
          <p className="text-navy-muted-foreground mt-1 text-sm">
            Pra quem assina até o fim do lançamento
          </p>
          <Button size="lg" className="mt-6 w-full gap-2">
            <Lock className="size-4" />
            Travar meu preço
          </Button>
        </div>

        <div className="border-navy-border bg-navy-card/50 rounded-2xl border p-8">
          <span className="text-navy-muted-foreground text-xs font-semibold uppercase">
            Preço atual
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">R$ 67</span>
            <span className="text-navy-muted-foreground text-sm">/mês</span>
          </div>
          <p className="text-navy-muted-foreground mt-1 text-sm">
            Valor pra quem assinar a partir do mês que vem
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-navy-border mt-6 w-full !bg-transparent text-white hover:!bg-white/10"
          >
            Assinar mesmo assim
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <p className="text-navy-muted-foreground mb-4 text-center text-sm font-semibold uppercase">
          Os dois planos incluem
        </p>
        <ul className={cn("grid gap-3 sm:grid-cols-2")}>
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </SectionContainer>
  )
}
