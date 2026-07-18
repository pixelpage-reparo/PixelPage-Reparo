import { useAuthStore } from "@/stores/auth-store"
import type { ModuleKey } from "@/types/domain"

/** Owners always pass; employees are gated by their module_permissions row. */
export function useModuleAccess(moduleKey: ModuleKey): boolean {
  return useAuthStore((state) => state.modulePermissions[moduleKey])
}

export function useIsOwner(): boolean {
  return useAuthStore((state) => state.profile?.role === "owner")
}
