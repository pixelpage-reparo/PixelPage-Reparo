import { useMutation } from "@tanstack/react-query"

type OrderType = "service_order" | "quote"

/**
 * Sends the device unlock PIN/pattern to be encrypted and stored — the
 * plaintext leaves the browser exactly once, over this request, and is
 * never written to Postgres directly by client code. See
 * src/app/api/device-secret/route.ts.
 */
export function useSaveDeviceSecret() {
  return useMutation({
    mutationFn: async (input: { orderType: OrderType; orderId: string; lockValue: string }) => {
      const response = await fetch("/api/device-secret", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar o dado de bloqueio")
      return data
    },
  })
}

/**
 * Decrypts and returns the device unlock PIN/pattern. Only the order's
 * assigned technician or the company owner can succeed here — everyone else
 * gets a 403 from src/app/api/device-secret/reveal/route.ts regardless of
 * what this hook's caller renders.
 */
export function useRevealDeviceSecret() {
  return useMutation({
    mutationFn: async (input: { orderType: OrderType; orderId: string }) => {
      const response = await fetch("/api/device-secret/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Não foi possível revelar o dado de bloqueio")
      return data.value as string
    },
  })
}
