"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuthListener } from "@/hooks/use-auth"
import { useOAuthErrorToast } from "@/hooks/use-oauth-error-toast"

function AuthListeners() {
  useAuthListener()
  useOAuthErrorToast()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per browser session (useState initializer, not a
  // module-level singleton) — the recommended RSC-safe pattern, since a
  // module-level QueryClient would be shared across requests on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // supabase-js/postgrest-js already retries network errors
            // internally (3 attempts, exponential backoff) before a
            // query's promise ever rejects. Retrying again on top of that
            // here would quadruple the worst-case time to reach an error
            // state for no benefit — our own thrown errors (e.g. "Nenhuma
            // empresa ativa") are deterministic anyway and retrying them
            // would just repeat the same failure.
            retry: 0,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AuthListeners />
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
