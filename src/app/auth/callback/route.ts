import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Exchanges the OAuth/password-recovery `code` for a session, server-side.
 * Replaces the SPA's reliance on supabase-js's `detectSessionInUrl`, which
 * silently parsed the redirect URL client-side on mount — that doesn't
 * exist in SSR, since the server (not a client-side auto-parse) is what
 * completes the code exchange here. signInWithGoogle/requestPasswordReset
 * point `redirectTo` at this route with a `?next=` target.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/app/dashboard"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (error) {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", error)
    if (errorDescription) loginUrl.searchParams.set("error_description", errorDescription)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(new URL(next, origin))
    }

    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", "exchange_failed")
    loginUrl.searchParams.set("error_description", exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL("/login", origin))
}
