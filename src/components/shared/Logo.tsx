import { Wrench } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: { icon: "size-6", iconInner: 14, text: "text-base" },
  md: { icon: "size-8", iconInner: 18, text: "text-xl" },
  lg: { icon: "size-10", iconInner: 22, text: "text-2xl" },
}

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "bg-brand-gradient inline-flex shrink-0 items-center justify-center rounded-xl text-white",
          s.icon
        )}
      >
        <Wrench size={s.iconInner} strokeWidth={2.5} />
      </span>
      {!iconOnly && (
        <span className={cn("text-foreground font-extrabold tracking-tight", s.text)}>
          Bancada
        </span>
      )}
    </div>
  )
}
