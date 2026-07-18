import { Check, X } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"

const ROWS = [
  { manual: "Contar peça no olho", automatic: "Baixa automática a cada OS fechada" },
  { manual: "Fechar caixa somando papel", automatic: "Fechamento por forma de pagamento, sozinho" },
  { manual: "Ligar pro cliente pra avisar do status", automatic: "Cliente acompanha o andamento da OS" },
  { manual: "Montar orçamento no papel", automatic: "Documento gerado com a marca da sua loja" },
  { manual: "Anotar quem pode ver o quê", automatic: "Permissão por módulo, configurada uma vez" },
  { manual: "Procurar aparelho igual em grupo de WhatsApp", automatic: "Vitrine pública com fotos e IMEI" },
]

export function ComparisonTable() {
  return (
    <SectionContainer tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow tone="dark">Não é mais uma coisa pra aprender</SectionEyebrow>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          O que você fazia na mão. O que a Bancada faz sozinha.
        </h2>
      </div>

      <div className="border-navy-border bg-navy-card mt-12 overflow-hidden rounded-2xl border">
        <div className="border-navy-border grid grid-cols-2 border-b text-sm font-semibold">
          <div className="text-navy-muted-foreground flex items-center gap-2 px-5 py-4">
            <X className="size-4" />
            Você fazia
          </div>
          <div className="border-navy-border flex items-center gap-2 border-l px-5 py-4">
            <Check className="text-success size-4" />
            Bancada faz sozinha
          </div>
        </div>
        {ROWS.map((row) => (
          <div key={row.manual} className="border-navy-border grid grid-cols-2 border-b text-sm last:border-b-0">
            <div className="text-navy-muted-foreground px-5 py-4">{row.manual}</div>
            <div className="border-navy-border border-l px-5 py-4 font-medium">
              {row.automatic}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
