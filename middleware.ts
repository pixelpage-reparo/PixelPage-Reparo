import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { getEnv } from "@/lib/env"

/**
 * Replaces the SPA's client-side ProtectedRoute.tsx: refreshes the Supabase
 * session cookie on every request (auth.getUser(), not getSession() — that
 * one doesn't revalidate the JWT against the server) and redirects
 * unauthenticated requests to /login before any protected page even starts
 * rendering. Does NOT check profile/company existence (that's a DB round
 * trip better done once in app/app/layout.tsx, which already fetches the
 * profile for the sidebar) — see RequireCompany-equivalent there.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const env = getEnv()
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ["/app/:path*", "/complete-signup"],
}
