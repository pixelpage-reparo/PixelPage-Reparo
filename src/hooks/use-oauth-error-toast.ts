import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Google/Supabase can redirect back with `?error=...&error_description=...`
 * (e.g. the user denied consent, or the callback route's code exchange
 * failed) instead of a session. Handled globally, once, in Providers —
 * mounted at the root layout — rather than per-page, since the error can
 * land on /login (from app/auth/callback/route.ts) or, in principle, any
 * other page. Reads window.location directly (not next/navigation's
 * useSearchParams) so this doesn't force the whole app into dynamic
 * rendering just to check for an occasional error param.
 */
export function useOAuthErrorToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (!error) return

    toast.error("Não foi possível continuar com o Google", {
      description: params.get("error_description")?.replace(/\+/g, " ") || "Tente novamente em instantes.",
    })

    params.delete("error")
    params.delete("error_code")
    params.delete("error_description")
    const search = params.toString()
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
    )
  }, [])
}
