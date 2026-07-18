import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type SectionTone = "light" | "dark"

interface SectionContainerProps {
  id?: string
  tone?: SectionTone
  className?: string
  containerClassName?: string
  children: ReactNode
}

export function SectionContainer({
  id,
  tone = "light",
  className,
  containerClassName,
  children,
}: SectionContainerProps) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={cn(
        "relative overflow-hidden py-16 md:py-24",
        tone === "dark"
          ? "bg-navy text-navy-foreground"
          : "bg-background text-foreground",
        className
      )}
    >
      <div className={cn("relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", containerClassName)}>
        {children}
      </div>
    </section>
  )
}

interface SectionEyebrowProps {
  tone?: SectionTone
  children: ReactNode
  className?: string
}

export function SectionEyebrow({ tone = "light", children, className }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        tone === "dark" ? "bg-white/10 text-white/80" : "bg-primary/10 text-primary",
        className
      )}
    >
      {children}
    </span>
  )
}
