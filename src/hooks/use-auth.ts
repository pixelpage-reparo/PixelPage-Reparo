import { useEffect } from "react"
import { useShallow } from "zustand/react/shallow"

import { supabase } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import type { ModuleKey } from "@/types/domain"

async function loadProfileData(userId: string) {
  const { setProfileData, setStatus } = useAuthStore.getState()

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

  if (!profile) {
    // No profile yet. If this is a fresh signup whose project requires email
    // confirmation, fn_create_company_and_owner() couldn't run right after
    // signUp() (no session existed yet) — the company/full name were stashed
    // in user_metadata instead. Finish the bootstrap now that a session exists.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const pendingCompanyName = user?.user_metadata?.pending_company_name as string | undefined
    const pendingFullName = user?.user_metadata?.pending_full_name as string | undefined

    if (pendingCompanyName && pendingFullName) {
      const { error } = await supabase.rpc("fn_create_company_and_owner", {
        p_company_name: pendingCompanyName,
        p_full_name: pendingFullName,
      })
      if (!error) {
        ;({ data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle())
      }
    }
  }

  if (!profile) {
    setProfileData(null, null, [])
    setStatus("authenticated")
    return
  }

  const [{ data: company }, { data: permissions }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", profile.company_id).maybeSingle(),
    supabase.from("module_permissions").select("module_key, can_view").eq("profile_id", userId),
  ])

  const visibleModules = (permissions ?? [])
    .filter((p) => p.can_view)
    .map((p) => p.module_key as ModuleKey)

  setProfileData(profile, company ?? null, visibleModules)
  setStatus("authenticated")
}

/** Wires the Supabase auth session into useAuthStore. Mount once, near the app root. */
export function useAuthListener() {
  useEffect(() => {
    let active = true
    const { setSession, setStatus, reset } = useAuthStore.getState()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setSession(session)
      if (session?.user) {
        void loadProfileData(session.user.id)
      } else {
        setStatus("unauthenticated")
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setSession(session)
      if (session?.user) {
        void loadProfileData(session.user.id)
      } else {
        reset()
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])
}

/**
 * Read-only selector for the current auth state. useShallow is required
 * here — without it, this selector returns a brand-new object on every
 * store read, so useSyncExternalStore never sees a stable snapshot and
 * the app re-renders in an infinite loop.
 */
export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      status: state.status,
      session: state.session,
      profile: state.profile,
      company: state.company,
      modulePermissions: state.modulePermissions,
    }))
  )
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signInWithGoogle(redirectTo: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })
  if (error) throw error
}

/**
 * Re-runs profile/company/permissions loading for the given user. Used by
 * CompleteSignupPage after a Google-first-login user creates their company
 * directly via RPC — that flow doesn't go through signUpWithPassword's
 * pending-metadata bootstrap, so the store needs an explicit refresh.
 */
export async function refreshProfile(userId: string) {
  await loadProfileData(userId)
}

interface SignUpResult {
  needsEmailConfirmation: boolean
}

export async function signUpWithPassword(
  email: string,
  password: string,
  companyName: string,
  fullName: string
): Promise<SignUpResult> {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { pending_company_name: companyName, pending_full_name: fullName },
    },
  })
  if (signUpError) throw signUpError

  if (!data.session) {
    // Email confirmation required — no session to run the bootstrap RPC
    // under yet. loadProfileData() finishes it on first login instead.
    return { needsEmailConfirmation: true }
  }

  const { error: rpcError } = await supabase.rpc("fn_create_company_and_owner", {
    p_company_name: companyName,
    p_full_name: fullName,
  })
  if (rpcError) throw rpcError

  return { needsEmailConfirmation: false }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
