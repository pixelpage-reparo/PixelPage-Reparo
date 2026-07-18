import type { KeyboardEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface KanbanCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function KanbanCard({ children, onClick, className }: KanbanCardProps) {
  // Not a native <button> — cards can host their own interactive controls
  // (e.g. a status <Select>), and nesting a button inside a button is
  // invalid HTML.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "border-border bg-card hover:border-primary/40 flex w-full flex-col gap-2 rounded-xl border p-3 text-left shadow-sm transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  )
}
