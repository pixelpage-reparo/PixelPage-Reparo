import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  children: ReactNode
  className?: string
}

export function KanbanBoard({ children, className }: KanbanBoardProps) {
  return (
    <div
      className={cn(
        "flex h-full gap-4 overflow-x-auto pb-4 [scrollbar-gutter:stable]",
        className
      )}
    >
      {children}
    </div>
  )
}
