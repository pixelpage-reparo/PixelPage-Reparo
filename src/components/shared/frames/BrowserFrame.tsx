import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface BrowserFrameProps {
  children: ReactNode
  url?: string
  className?: string
}

export function BrowserFrame({
  children,
  url = "app.bancada.com.br",
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card overflow-hidden rounded-2xl border shadow-2xl shadow-black/10",
        className
      )}
    >
      <div className="border-border/60 bg-muted/60 flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="bg-background/80 text-muted-foreground mx-auto flex max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[11px]">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {url}
        </div>
      </div>
      <div className="bg-background">{children}</div>
    </div>
  )
}
