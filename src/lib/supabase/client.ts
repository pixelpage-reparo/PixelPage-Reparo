import { createClient } from "@supabase/supabase-js"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

// main.tsx already validated env at boot before this module ever loads;
// this just reads the cached, already-valid result. If some other entry
// point ever imports this file without going through main.tsx's flow,
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

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithTimeout(8000) },
})
