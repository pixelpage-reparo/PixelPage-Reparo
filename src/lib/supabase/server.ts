import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions — reads/writes the session via the request's cookies. Used
 * by app/app/layout.tsx (RequireCompany-equivalent profile check) and
 * app/auth/callback/route.ts (OAuth/recovery code exchange). Must be
 * constructed fresh per request (cookies() is request-scoped), never
 * module-level cached like the browser client.
 */
export async function createClient() {
  const env = getEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component render (not a Route Handler/
          // Server Action) — cookies() is read-only there. Safe to ignore
          // because middleware.ts already refreshes the session cookie on
          // every request; this write is just a would-be optimization.
        }
      },
    },
  })
}
