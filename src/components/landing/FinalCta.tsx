import { ArrowRight } from "lucide-react"

import { SectionContainer } from "@/components/shared/SectionContainer"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <SectionContainer tone="dark" className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Daqui a um mês o preço muda. Sua bancada não precisa continuar do jeito que está.
        </h2>
        <p className="text-navy-muted-foreground mt-4 text-base">
          Comece hoje, teste por 7 dias e trave o valor de lançamento antes que ele suba.
        </p>
        <Button size="lg" className="mt-8 h-12 gap-2 px-7 text-base">
          Testar grátis por 7 dias
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </SectionContainer>
  )
}
