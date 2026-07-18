import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app/AppSidebar"
import { AppTopbar } from "@/components/app/AppTopbar"
import { OfflineBanner } from "@/components/shared/OfflineBanner"

export function AppShell() {
  return (
    <div className="bg-background flex h-svh">
      <aside className="border-border hidden w-64 shrink-0 border-r lg:block">
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
