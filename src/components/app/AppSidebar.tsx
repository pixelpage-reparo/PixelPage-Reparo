"use client"

import {
  Banknote,
  BarChart3,
  Kanban,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageCircleHeart,
  Package,
  ShoppingCart,
  Smartphone,
  Store,
  Users,
  UserCog,
  Wallet,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Logo } from "@/components/shared/Logo"
import { useModuleAccess } from "@/hooks/use-permissions"
import { MODULE_GROUPS, MODULE_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { ModuleKey } from "@/types/domain"

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  mesa_fluxo: Kanban,
  service_orders: Wrench,
  quotes: FileText,
  clients: Users,
  inventory: Package,
  pos: ShoppingCart,
  resale_devices: Smartphone,
  showcase: Store,
  post_sale: MessageCircleHeart,
  services_catalog: ClipboardList,
  finance: Wallet,
  cash_register: Banknote,
  reports: BarChart3,
  team: UserCog,
  settings: UserCog,
}

const MODULE_PATHS: Record<ModuleKey, string> = {
  dashboard: "/app/dashboard",
  mesa_fluxo: "/app/mesa-fluxo",
  service_orders: "/app/service-orders",
  quotes: "/app/quotes",
  clients: "/app/clients",
  inventory: "/app/inventory",
  pos: "/app/pos",
  resale_devices: "/app/resale-devices",
  showcase: "/app/showcase",
  post_sale: "/app/post-sale",
  services_catalog: "/app/services",
  finance: "/app/finance",
  cash_register: "/app/cash-register",
  reports: "/app/reports",
  team: "/app/team",
  settings: "/app/settings",
}

function NavItemLink({ module, onNavigate }: { module: ModuleKey; onNavigate?: () => void }) {
  const hasAccess = useModuleAccess(module)
  const pathname = usePathname()
  if (!hasAccess) return null

  const path = MODULE_PATHS[module]
  const Icon = MODULE_ICONS[module]
  const isActive = pathname === path || pathname?.startsWith(`${path}/`)

  return (
    <Link
      href={path}
      onClick={onNavigate}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
      )}
    >
      <Icon className="size-4.5 shrink-0" strokeWidth={1.75} />
      {MODULE_LABELS[module]}
    </Link>
  )
}

interface AppSidebarProps {
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  return (
    <div className={cn("flex h-full flex-col gap-1 overflow-y-auto p-4", className)}>
      <div className="px-2 py-3">
        <Logo size="sm" />
      </div>
      <nav className="flex flex-col gap-4">
        {MODULE_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="text-muted-foreground/70 px-3 text-[0.7rem] font-semibold tracking-wide uppercase">
              {group.label}
            </p>
            {group.modules.map((module) => (
              <NavItemLink key={module} module={module} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>
    </div>
  )
}
