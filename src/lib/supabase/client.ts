import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once .env carries a real project's credentials. Nothing in this app should call Supabase before that. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidos — rodando sem projeto Supabase real. Preencha o .env quando a integração for feita."
  )
}

/**
 * Without this, a request against the placeholder host (or any real but
 * unreachable host) hangs until the underlying fetch's own OS-level
 * timeout — tens of seconds — before supabase-js/react-query ever see a
 * rejection to settle on. An explicit timeout means every query fails
 * fast and predictably instead of leaving pages stuck on a loading
 * skeleton indefinitely.
 */
function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    if (init?.signal) return fetch(input, init)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
  }
}

// createClient() never makes a network call on its own, so a placeholder
// value here keeps the app from crashing before those envs are filled in.
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "public-anon-key-placeholder",
  { global: { fetch: fetchWithTimeout(8000) } }
)
