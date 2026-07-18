import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/19.5] w-[260px] rounded-[2.5rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl shadow-black/20 dark:border-neutral-700",
        className
      )}
    >
      <div className="bg-background relative h-full w-full overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 right-0 left-0 z-10 flex justify-center">
          <div className="mt-1.5 h-5 w-24 rounded-full bg-neutral-900" />
        </div>
        <div className="h-full w-full overflow-y-auto">{children}</div>
        <div className="absolute right-0 bottom-1.5 left-0 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-neutral-900/30" />
        </div>
      </div>
    </div>
  )
}
