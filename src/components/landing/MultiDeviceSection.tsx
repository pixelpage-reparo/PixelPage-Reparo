import { Download, RefreshCw, WifiOff } from "lucide-react"

import { SectionContainer, SectionEyebrow } from "@/components/shared/SectionContainer"
import { PhoneFrame } from "@/components/shared/frames/PhoneFrame"
import { BrowserFrame } from "@/components/shared/frames/BrowserFrame"
import { StatCard } from "@/components/shared/StatCard"
import { Wallet, Wrench } from "lucide-react"

const POINTS = [
  {
    icon: RefreshCw,
    title: "Sincroniza na hora",
    body: "Abriu uma OS no celular do balcão, ela já aparece no computador do escritório. Em tempo real, sem apertar nenhum botão de atualizar.",
  },
  {
    icon: Download,
    title: "Instala como app",
    body: "Sem loja de aplicativo, sem espaço ocupado. A Bancada instala direto do navegador e fica na tela inicial do celular ou tablet.",
  },
  {
    icon: WifiOff,
    title: "Funciona até sem internet",
    body: "Caiu o Wi-Fi da loja? Você ainda consegue consultar o que já estava aberto na tela, pra não travar o atendimento.",
  },
]

export function MultiDeviceSection() {
  return (
    <SectionContainer tone="light">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <SectionEyebrow>Celular, tablet e computador</SectionEyebrow>
          <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Sempre os mesmos dados, em qualquer tela da bancada.
          </h2>
          <div className="mt-8 flex flex-col gap-6">
            {POINTS.map((point) => (
              <div key={point.title} className="flex gap-4">
                <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <point.icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-foreground text-sm font-semibold">{point.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {point.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center py-8">
          <BrowserFrame url="app.bancada.com.br" className="w-full max-w-sm">
            <div className="grid grid-cols-2 gap-2 p-3">
              <StatCard label="Faturamento" value="R$ 1.284" icon={Wallet} tone="success" />
              <StatCard label="OS abertas" value="12" icon={Wrench} tone="warning" />
            </div>
          </BrowserFrame>
          <PhoneFrame className="absolute -right-2 -bottom-10 w-[150px] sm:right-4 sm:-bottom-14">
            <div className="p-2 pt-8">
              <StatCard label="Faturamento" value="R$ 1.284" tone="success" className="p-3" />
            </div>
          </PhoneFrame>
        </div>
      </div>
    </SectionContainer>
  )
}
