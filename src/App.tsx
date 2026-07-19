import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { toast } from "sonner"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useAuthListener } from "@/hooks/use-auth"
import { AppRoutes } from "@/routes/router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // supabase-js/postgrest-js already retries network errors internally
      // (3 attempts, exponential backoff) before a query's promise ever
      // rejects. Retrying again on top of that here would quadruple the
      // worst-case time to reach an error state for no benefit — our own
      // thrown errors (e.g. "Nenhuma empresa ativa") are deterministic
      // anyway and retrying them would just repeat the same failure.
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Google/Supabase can redirect back with `?error=...&error_description=...`
 * (e.g. the user denied consent) instead of a session. That redirect lands
 * on /app/dashboard, which ProtectedRoute would silently bounce to /login
 * before a page-specific handler ever mounts — so this is handled globally,
 * once, at the app root, and the params are stripped from the URL after.
 */
function useOAuthErrorToast() {
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

function AuthenticatedApp() {
  useAuthListener()
  useOAuthErrorToast()
  return <AppRoutes />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={200}>
          <AuthenticatedApp />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
