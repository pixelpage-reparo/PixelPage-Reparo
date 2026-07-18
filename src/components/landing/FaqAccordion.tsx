import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"

const FAQS = [
  {
    q: "Preciso saber mexer em computador?",
    a: "Se você usa WhatsApp, você usa a Bancada. A tela é pensada pro dia a dia da bancada, sem termo técnico e sem curso necessário.",
  },
  {
    q: "Meus dados e os dados dos meus clientes ficam seguros?",
    a: "Sim. Seguimos as boas práticas de proteção de dados (LGPD) e cada loja só enxerga as próprias informações — nunca de outra assistência.",
  },
  {
    q: "Dá pra usar no celular ou só no computador?",
    a: "Dá pra usar nos dois, ao mesmo tempo, sincronizado. Você abre uma OS no computador e continua o atendimento no celular, na hora.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Pode. Não tem fidelidade nem multa. E ainda tem garantia de 7 dias com devolução total, caso não sirva pra você.",
  },
  {
    q: "Funciona se eu tiver mais de um funcionário?",
    a: "Funciona — inclusive é aí que a Bancada mais ajuda. Cada funcionário só vê o que você libera, e toda ação fica registrada com nome e horário.",
  },
  {
    q: "E se eu não gostar do sistema?",
    a: "Você tem 7 dias pra testar de verdade. Não fez sentido? A gente devolve o valor pago, sem burocracia.",
  },
]

export function FaqAccordion() {
  return (
    <SectionContainer id="duvidas" tone="light">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow>Perguntas frequentes</SectionEyebrow>
        <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Perguntas que todo técnico faz
        </h2>
      </div>

      <Accordion type="single" collapsible className="mx-auto mt-10 max-w-2xl">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`}>
            <AccordionTrigger className="text-foreground text-left text-base font-semibold">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionContainer>
  )
}
