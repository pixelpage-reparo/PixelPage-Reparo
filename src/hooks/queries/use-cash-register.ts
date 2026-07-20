import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"

export function useCurrentCashSession() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["cash-register-session", "current", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("status", "open")
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useCashSessionHistory() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["cash-register-session", "history", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useOpenCashSession() {
  const queryClient = useQueryClient()
  const { company, profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      startingFloatCents,
      openedByProfileId,
    }: {
      startingFloatCents: number
      openedByProfileId?: string
    }) => {
      if (!company || !profile) throw new Error("Nenhuma empresa ativa")
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .insert({
          company_id: company.id,
          opened_by: openedByProfileId ?? profile.id,
          starting_float_cents: startingFloatCents,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash-register-session"] }),
  })
}

/**
 * Expected cash = starting float + cash-tagged income/expense recorded
 * since the session opened. Computed at close time from
 * financial_transactions by timestamp range (not a register_session_id FK
 * on every cash-producing insert path) — see 0023's migration comment.
 */
export function useCloseCashSession() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ sessionId, countedTotalCents }: { sessionId: string; countedTotalCents: number }) => {
      if (!profile) throw new Error("Nenhuma empresa ativa")

      const { data: session, error: sessionError } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("id", sessionId)
        .single()
      if (sessionError) throw sessionError

      const { data: cashTransactions, error: txError } = await supabase
        .from("financial_transactions")
        .select("type, amount_cents")
        .eq("payment_method", "cash")
        .gte("created_at", session.opened_at)
      if (txError) throw txError

      const netCashMovement = (cashTransactions ?? []).reduce(
        (sum, t) => sum + (t.type === "income" ? t.amount_cents : -t.amount_cents),
        0
      )
      const expectedTotalCents = session.starting_float_cents + netCashMovement
      const discrepancyCents = countedTotalCents - expectedTotalCents

      const { error } = await supabase
        .from("cash_register_sessions")
        .update({
          status: "closed",
          closed_by: profile.id,
          closed_at: new Date().toISOString(),
          counted_total_cents: countedTotalCents,
          expected_total_cents: expectedTotalCents,
          discrepancy_cents: discrepancyCents,
        })
        .eq("id", sessionId)
      if (error) throw error

      return { expectedTotalCents, discrepancyCents }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash-register-session"] }),
  })
}
