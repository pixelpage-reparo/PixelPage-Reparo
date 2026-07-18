import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"

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

function AuthenticatedApp() {
  useAuthListener()
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
