import type { Session } from "@supabase/supabase-js"
import { create } from "zustand"

import { MODULE_KEYS } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"
import type { ModuleKey } from "@/types/domain"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"]

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  status: AuthStatus
  session: Session | null
  profile: ProfileRow | null
  company: CompanyRow | null
  /** Module visibility for the current profile. Owners see every module regardless of this map. */
  modulePermissions: Record<ModuleKey, boolean>
  setSession: (session: Session | null) => void
  setProfileData: (profile: ProfileRow | null, company: CompanyRow | null, visibleModules: ModuleKey[]) => void
  setStatus: (status: AuthStatus) => void
  reset: () => void
}

const emptyPermissions = MODULE_KEYS.reduce(
  (acc, key) => {
    acc[key] = false
    return acc
  },
  {} as Record<ModuleKey, boolean>
)

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  session: null,
  profile: null,
  company: null,
  modulePermissions: emptyPermissions,

  setSession: (session) => set({ session }),

  setProfileData: (profile, company, visibleModules) => {
    const modulePermissions = { ...emptyPermissions }
    const isOwner = profile?.role === "owner"
    for (const key of MODULE_KEYS) {
      modulePermissions[key] = isOwner || visibleModules.includes(key)
    }
    set({ profile, company, modulePermissions })
  },

  setStatus: (status) => set({ status }),

  reset: () =>
    set({
      status: "unauthenticated",
      session: null,
      profile: null,
      company: null,
      modulePermissions: emptyPermissions,
    }),
}))
