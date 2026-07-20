import type { Metadata, Viewport } from "next"

import { Providers } from "@/app/providers"

import "./globals.css"

export const metadata: Metadata = {
  title: "Bancada — Gestão para Assistência Técnica",
  description:
    "Bancada — o sistema de gestão para assistências técnicas de celular. OS, estoque, financeiro e equipe, sincronizados em tempo real.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon-180.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#2f6fed",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
