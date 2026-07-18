import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TabletFrameProps {
  children: ReactNode
  className?: string
}

export function TabletFrame({ children, className }: TabletFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[4/3] w-full max-w-md rounded-[1.75rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl shadow-black/20 dark:border-neutral-700",
        className
      )}
    >
      <div className="bg-background h-full w-full overflow-hidden rounded-[0.9rem]">
        {children}
      </div>
    </div>
  )
}
