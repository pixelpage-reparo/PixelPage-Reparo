import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
  UserCog,
  Wallet,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router-dom"

import { Logo } from "@/components/shared/Logo"
import { useModuleAccess } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import type { ModuleKey } from "@/types/domain"

interface NavItem {
  module: ModuleKey
  label: string
  path: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { module: "dashboard", label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
  { module: "service_orders", label: "Ordens de Serviço", path: "/app/service-orders", icon: Wrench },
  { module: "clients", label: "Clientes", path: "/app/clients", icon: Users },
  { module: "inventory", label: "Estoque", path: "/app/inventory", icon: Package },
  { module: "finance", label: "Financeiro", path: "/app/finance", icon: Wallet },
  { module: "team", label: "Equipe", path: "/app/team", icon: UserCog },
  { module: "pos", label: "PDV", path: "/app/pos", icon: ShoppingCart },
  { module: "showcase", label: "Vitrine", path: "/app/showcase", icon: Store },
]

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const hasAccess = useModuleAccess(item.module)
  if (!hasAccess) return null

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
        )
      }
    >
      <item.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
      {item.label}
    </NavLink>
  )
}

interface AppSidebarProps {
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  return (
    <div className={cn("flex h-full flex-col gap-1 p-4", className)}>
      <div className="px-2 py-3">
        <Logo size="sm" />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.module} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  )
}
