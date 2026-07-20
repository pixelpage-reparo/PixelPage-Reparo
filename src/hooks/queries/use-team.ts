import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import { MODULE_KEYS } from "@/lib/constants"
import type { ModuleKey } from "@/types/domain"

export function useTeamMembers() {
  const { company } = useAuth()

  return useQuery({
    queryKey: ["team-members", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!company,
  })
}

export function useModulePermissions(profileId: string | undefined) {
  return useQuery({
    queryKey: ["module-permissions", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_permissions")
        .select("*")
        .eq("profile_id", profileId!)
      if (error) throw error

      const map = MODULE_KEYS.reduce(
        (acc, key) => {
          acc[key] = false
          return acc
        },
        {} as Record<ModuleKey, boolean>
      )
      for (const row of data) map[row.module_key] = row.can_view
      return map
    },
    enabled: !!profileId,
  })
}

export function useToggleModulePermission() {
  const queryClient = useQueryClient()
  const { company } = useAuth()

  return useMutation({
    mutationFn: async ({
      profileId,
      moduleKey,
      canView,
    }: {
      profileId: string
      moduleKey: ModuleKey
      canView: boolean
    }) => {
      if (!company) throw new Error("Nenhuma empresa ativa")
      const { error } = await supabase
        .from("module_permissions")
        .upsert(
          { profile_id: profileId, company_id: company.id, module_key: moduleKey, can_view: canView },
          { onConflict: "profile_id,module_key" }
        )
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["module-permissions", variables.profileId] })
    },
  })
}

/**
 * Bancada eligibility — whether this employee shows up as an option in the
 * Nova OS / Orçamento wizards' "Recebido Por" / "Executor do Reparo"
 * pickers. Independent of module_permissions and of job_title.
 */
export function useUpdateBancadaFlags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      bancadaIntake,
      bancadaExecutor,
    }: {
      profileId: string
      bancadaIntake?: boolean
      bancadaExecutor?: boolean
    }) => {
      const updates: { bancada_intake?: boolean; bancada_executor?: boolean } = {}
      if (bancadaIntake !== undefined) updates.bancada_intake = bancadaIntake
      if (bancadaExecutor !== undefined) updates.bancada_executor = bancadaExecutor
      const { error } = await supabase.from("profiles").update(updates).eq("id", profileId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }),
  })
}

/** Toggles the PRO-plan-limited "Acesso no App" seat for an employee. */
export function useUpdateAppAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ profileId, enabled }: { profileId: string; enabled: boolean }) => {
      const { error } = await supabase.from("profiles").update({ app_access_enabled: enabled }).eq("id", profileId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }),
  })
}
