import { Star } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"
import { cn } from "@/lib/utils"

interface Testimonial {
  name: string
  shop: string
  quote: string
  rating: number
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcos Ferreira",
    shop: "Fix Cell — Campinas/SP",
    quote:
      "Hoje eu fecho o caixa do sofá, sem abrir o notebook da loja. Antes eu levava trabalho pra casa todo santo dia.",
    rating: 5,
    initials: "MF",
  },
  {
    name: "Juliana Prado",
    shop: "TecCel Assistência — Curitiba/PR",
    quote:
      "Parei de perder peça. O sistema baixa sozinho assim que eu uso na OS. Isso já pagou a mensalidade sozinho.",
    rating: 5,
    initials: "JP",
  },
  {
    name: "Renato Alves",
    shop: "R.A. Celulares — Salvador/BA",
    quote:
      "Meu funcionário vê só o que precisa ver. Financeiro é comigo. Isso me deixou muito mais tranquilo pra delegar.",
    rating: 5,
    initials: "RA",
  },
]

export function TestimonialsCarousel() {
  return (
    <SectionContainer tone="light">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow>Quem usa, recomenda</SectionEyebrow>
        <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Mais de 800 assistências já saíram do caderno
        </h2>
      </div>

      <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className={cn(
              "border-border bg-card w-[85%] shrink-0 snap-center rounded-2xl border p-6 shadow-sm md:w-auto"
            )}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="fill-warning text-warning size-4" />
              ))}
            </div>
            <p className="text-foreground mt-4 text-sm leading-relaxed">“{t.quote}”</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-bold">
                {t.initials}
              </span>
              <div>
                <p className="text-foreground text-sm font-semibold">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.shop}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
