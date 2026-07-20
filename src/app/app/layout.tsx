import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { AppShell } from "@/components/app/AppShell"
import { createClient } from "@/lib/supabase/server"

/**
 * Server Component replacing RequireCompany.tsx: middleware.ts already
 * guarantees a session exists for everything under /app/*, so this only
 * checks the one thing middleware deliberately skips (a DB round trip) —
 * whether a profile row exists yet. A session can exist without one:
 * first-time Google sign-in has no equivalent to signUpWithPassword's
 * pending-metadata bootstrap, so it lands here without a company yet.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/complete-signup")
  }

  return <AppShell>{children}</AppShell>
}
