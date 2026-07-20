import Link from "next/link"
import type { ReactNode } from "react"

import { Logo } from "@/components/shared/Logo"

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
          <h1 className="text-foreground text-xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>}

          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  )
}
