import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  title: string
  count?: number
  accentClassName?: string
  children: ReactNode
  className?: string
}

export function KanbanColumn({
  title,
  count,
  accentClassName,
  children,
  className,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "bg-muted/40 flex h-full w-72 shrink-0 flex-col rounded-2xl",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className={cn("size-2 rounded-full", accentClassName ?? "bg-primary")} />
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {typeof count === "number" && (
          <span className="text-muted-foreground bg-background ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">{children}</div>
    </div>
  )
}
