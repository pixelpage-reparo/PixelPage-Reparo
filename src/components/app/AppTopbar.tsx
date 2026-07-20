"use client"

import { LogOut, Menu, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app/AppSidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { signOut, useAuth } from "@/hooks/use-auth"

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function AppTopbar() {
  const router = useRouter()
  const { profile, company } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      toast.error("Não foi possível sair", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {company?.name ?? "Sua assistência"}
          </p>
          {company?.plan === "trial" && (
            <p className="text-muted-foreground text-xs">Período de teste</p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {profile ? initialsFor(profile.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">
            {profile?.full_name ?? "Minha conta"}
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/app/settings")}>
            <Settings />
            Minha Assistência
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
