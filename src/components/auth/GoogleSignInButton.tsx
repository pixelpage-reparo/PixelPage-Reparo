import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/hooks/use-auth"

interface GoogleSignInButtonProps {
  label?: string
}

export function GoogleSignInButton({ label = "Continuar com Google" }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await signInWithGoogle(`${window.location.origin}/app/dashboard`)
    } catch (error) {
      toast.error("Não foi possível continuar com o Google", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      })
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={loading}
    >
      <GoogleIcon />
      {loading ? "Redirecionando..." : label}
    </Button>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1-.38-2.27c0-.79.14-1.55.38-2.27v-3.1H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}
