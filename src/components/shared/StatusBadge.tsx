import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "default" | "success" | "warning" | "destructive" | "muted"

interface StatusBadgeProps {
  tone?: StatusTone
  children: ReactNode
  className?: string
}

const toneClasses: Record<StatusTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
}

export function StatusBadge({ tone = "default", children, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", {
          "bg-primary": tone === "default",
          "bg-success": tone === "success",
          "bg-warning": tone === "warning",
          "bg-destructive": tone === "destructive",
          "bg-muted-foreground": tone === "muted",
        })}
      />
      {children}
    </span>
  )
}
