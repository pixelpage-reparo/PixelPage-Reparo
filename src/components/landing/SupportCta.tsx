import { MessageCircle } from "lucide-react"

import { SectionContainer } from "@/components/shared/SectionContainer"
import { Button } from "@/components/ui/button"

export function SupportCta() {
  return (
    <SectionContainer tone="light" className="py-14 md:py-16">
      <div className="bg-primary/5 border-primary/10 mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-3xl border p-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="text-foreground text-xl font-bold">Ficou com dúvida?</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Fala com a gente agora, sem robô no meio do caminho.
          </p>
        </div>
        <Button size="lg" className="shrink-0 gap-2">
          <MessageCircle className="size-4" />
          Chamar no WhatsApp
        </Button>
      </div>
    </SectionContainer>
  )
}
