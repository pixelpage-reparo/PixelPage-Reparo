import { Check } from "lucide-react"

const ITEMS = [
  "OS digital com foto",
  "Baixa automática de estoque",
  "Caixa fecha sozinho",
  "Vitrine com IMEI verificado",
  "Equipe com permissão por módulo",
  "PDV integrado à OS",
  "Funciona no celular, tablet e PC",
]

function MarqueeContent() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map((item) => (
        <span key={item} className="text-foreground/80 flex items-center gap-2 text-sm font-medium whitespace-nowrap">
          <Check className="text-success size-4 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  )
}

export function MarqueeStrip() {
  return (
    <div className="border-border/60 bg-muted/30 border-y py-4">
      <div className="flex overflow-hidden">
        <div className="animate-marquee flex shrink-0">
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
    </div>
  )
}
