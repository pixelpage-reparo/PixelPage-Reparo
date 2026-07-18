import { UserCog, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useModulePermissions, useTeamMembers, useToggleModulePermission } from "@/hooks/queries/use-team"
import { MODULE_LABELS, MODULE_KEYS } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function PermissionsGrid({ profile }: { profile: ProfileRow }) {
  const { data: permissions, isLoading } = useModulePermissions(profile.id)
  const toggle = useToggleModulePermission()

  if (isLoading || !permissions) {
    return <Skeleton className="h-24 w-full rounded-xl" />
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODULE_KEYS.map((key) => (
        <label
          key={key}
          className="border-border flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
        >
          <span className="text-foreground">{MODULE_LABELS[key]}</span>
          <Switch
            checked={permissions[key]}
            onCheckedChange={(checked) =>
              toggle.mutate({ profileId: profile.id, moduleKey: key, canView: checked })
            }
          />
        </label>
      ))}
    </div>
  )
}

function TeamPage() {
  const { data: members, isLoading } = useTeamMembers()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Equipe"
        description="Quem vê o quê — permissão por módulo."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              toast.info("Convidar funcionário entra numa fase futura (precisa de projeto Supabase conectado).")
            }
          >
            <UserPlus className="size-4" />
            Convidar funcionário
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(members ?? []).map((member) => (
            <div key={member.id} className="border-border flex flex-col gap-4 rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {initialsFor(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">{member.full_name}</p>
                  <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                </div>
                {member.role === "owner" ? (
                  <StatusBadge tone="default">Dono</StatusBadge>
                ) : (
                  <StatusBadge tone="muted">Funcionário</StatusBadge>
                )}
              </div>

              {member.role === "owner" ? (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <UserCog className="size-4" />
                  Acesso completo a todos os módulos.
                </p>
              ) : (
                <PermissionsGrid profile={member} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamPage
