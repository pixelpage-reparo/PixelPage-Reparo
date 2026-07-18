import { BookX, CircleHelp, PackageX } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"

interface PainBlock {
  icon: LucideIcon
  title: string
  body: string
}

const BLOCKS: PainBlock[] = [
  {
    icon: BookX,
    title: "Aquele caderno de OS que só você entende",
    body: "O cliente liga perguntando do aparelho e você vira a loja de cabeça pra baixo atrás de uma anotação torta, numa folha solta, que ninguém mais consegue ler além de você.",
  },
  {
    icon: CircleHelp,
    title: "Fim do mês e a mesma pergunta de sempre",
    body: "Sobrou dinheiro ou não? Você trabalhou o mês inteiro e não sabe dizer, de cabeça, se o caixa fechou no azul. A resposta está espalhada entre WhatsApp, papel e memória.",
  },
  {
    icon: PackageX,
    title: "A peça que sumiu e o cliente que não volta",
    body: "Vendeu uma peça, esqueceu de anotar, e na próxima OS ela simplesmente não está lá. Enquanto isso, o cliente espera — e começa a procurar outra assistência.",
  },
]

export function PainSection() {
  return (
    <SectionContainer tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow tone="dark">O problema não é o conserto</SectionEyebrow>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Você não perde tempo consertando aparelho. Você perde tempo com a cabeça cheia.
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {BLOCKS.map((block) => (
          <div
            key={block.title}
            className="border-navy-border bg-navy-card rounded-2xl border p-6"
          >
            <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-white/10">
              <block.icon className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="text-lg font-semibold">{block.title}</h3>
            <p className="text-navy-muted-foreground mt-2 text-sm leading-relaxed">
              {block.body}
            </p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
