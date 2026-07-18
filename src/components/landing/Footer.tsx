import { ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { Logo } from "@/components/shared/Logo"

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", href: "#recursos" },
      { label: "Planos", href: "#planos" },
      { label: "Dúvidas", href: "#duvidas" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade (LGPD)", href: "/privacidade" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo size="sm" />
            <p className="text-navy-muted-foreground mt-3 max-w-xs text-sm">
              O sistema de gestão feito pra quem vive de conserto de celular e eletrônicos.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) =>
                  link.href.startsWith("#") ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-navy-muted-foreground hover:text-navy-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-navy-muted-foreground hover:text-navy-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-navy-border text-navy-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Bancada. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Pagamento protegido e criptografado
          </span>
        </div>
      </div>
    </footer>
  )
}
