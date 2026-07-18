import { Check } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface FeatureBlockProps {
  eyebrow: string
  eyebrowClassName?: string
  title: string
  description: string
  bullets: string[]
  align: "left" | "right"
  mockup: ReactNode
}

export function FeatureBlock({
  eyebrow,
  eyebrowClassName,
  title,
  description,
  bullets,
  align,
  mockup,
}: FeatureBlockProps) {
  return (
    <div className="grid items-center gap-10 py-14 first:pt-0 last:pb-0 md:grid-cols-2 md:gap-16">
      <div className={cn(align === "right" && "md:order-2")}>
        <span
          className={cn(
            "mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            eyebrowClassName ?? "bg-primary/10 text-primary"
          )}
        >
          {eyebrow}
        </span>
        <h3 className="text-foreground text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {title}
        </h3>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">{description}</p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="text-foreground flex items-start gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(align === "right" && "md:order-1")}>{mockup}</div>
    </div>
  )
}
