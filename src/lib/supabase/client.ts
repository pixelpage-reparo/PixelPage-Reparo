import { createBrowserClient } from "@supabase/ssr"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

// The root layout already validated env at boot before this module ever
// loads; this just reads the cached, already-valid result. If some other
// entry point ever imports this file without going through that flow,
// getEnv() still validates (and throws the same clear error) on its own.
const env = getEnv()

/**
 * Without this, a request against an unreachable host hangs until the
 * underlying fetch's own OS-level timeout — tens of seconds — before
 * supabase-js/react-query ever see a rejection to settle on. An explicit
 * timeout means every query fails fast and predictably instead of leaving
 * pages stuck on a loading skeleton indefinitely.
 */
function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    if (init?.signal) return fetch(input, init)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
  }
}

/**
 * Browser client — used by every Client Component data hook under
 * src/hooks/queries/*.ts, unchanged from before the Next.js migration. RLS
 * (not this client) is the real security boundary, so this is safe to
 * construct with the public anon key exactly as it was under Vite.
 */
export const supabase = createBrowserClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: { fetch: fetchWithTimeout(8000) },
  }
)
