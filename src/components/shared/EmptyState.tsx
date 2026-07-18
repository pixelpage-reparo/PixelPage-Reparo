import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="bg-muted text-muted-foreground inline-flex size-12 items-center justify-center rounded-full">
          <Icon className="size-5.5" strokeWidth={1.75} />
        </span>
      )}
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
