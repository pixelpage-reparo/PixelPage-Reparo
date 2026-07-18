import { ShieldCheck } from "lucide-react"

import { SectionContainer } from "@/components/shared/SectionContainer"

interface GuaranteeSectionProps {
  days?: number
}

export function GuaranteeSection({ days = 7 }: GuaranteeSectionProps) {
  return (
    <SectionContainer tone="light">
      <div className="border-border bg-card mx-auto flex max-w-2xl flex-col items-center rounded-3xl border p-10 text-center shadow-sm">
        <span className="bg-success-bg text-success mb-5 inline-flex size-16 items-center justify-center rounded-full">
          <ShieldCheck className="size-7" strokeWidth={1.75} />
        </span>
        <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {days} dias pra testar na sua bancada de verdade.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
          Use com OS de verdade, cliente de verdade, estoque de verdade. Se não fizer sentido pro
          seu dia a dia, devolvemos cada centavo — sem perguntas, sem burocracia.
        </p>
      </div>
    </SectionContainer>
  )
}
