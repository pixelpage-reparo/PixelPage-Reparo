import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon?: LucideIcon
  trend?: {
    value: string
    direction: "up" | "down"
  }
  tone?: "default" | "success" | "warning" | "destructive"
  className?: string
}

const toneIconClasses = {
  default: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        {Icon && (
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl",
              toneIconClasses[tone]
            )}
          >
            <Icon className="size-4.5" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
