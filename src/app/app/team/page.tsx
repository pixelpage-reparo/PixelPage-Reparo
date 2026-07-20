"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Headset, KeyRound, UserCog, UserPlus, Users, Wrench } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import {
  useModulePermissions,
  useTeamMembers,
  useToggleModulePermission,
  useUpdateAppAccess,
  useUpdateBancadaFlags,
} from "@/hooks/queries/use-team"
import { JOB_TITLE_LABELS, MODULE_LABELS, MODULE_KEYS, PLAN_APP_ACCESS_LIMITS } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"
import type { ProfileJobTitle } from "@/types/domain"

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

/**
 * Bancada eligibility (Responsável pela Entrada / Executor de Reparos) and
 * the PRO-plan-limited "Acesso no App" seat — independent of both job_title
 * (a pure label) and module_permissions (screen access). Owners always keep
 * app access and aren't counted against the plan seat limit, so their row
 * skips that toggle.
 */
function BancadaControls({
  profile,
  allMembers,
  showAppAccess,
}: {
  profile: ProfileRow
  allMembers: ProfileRow[]
  showAppAccess: boolean
}) {
  const { company } = useAuth()
  const updateBancada = useUpdateBancadaFlags()
  const updateAppAccess = useUpdateAppAccess()

  const limit = company ? PLAN_APP_ACCESS_LIMITS[company.plan] : 0
  const activeAppAccessCount = allMembers.filter((m) => m.role !== "owner" && m.app_access_enabled).length
  const atLimit = showAppAccess && !profile.app_access_enabled && activeAppAccessCount >= limit

  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Bancada</p>
      <label className="flex items-center justify-between gap-2 text-sm">
        <span className="text-foreground">Responsável pela Entrada</span>
        <Switch
          checked={profile.bancada_intake}
          onCheckedChange={(checked) =>
            updateBancada.mutate({ profileId: profile.id, bancadaIntake: checked })
          }
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        <span className="text-foreground">Executor de Reparos</span>
        <Switch
          checked={profile.bancada_executor}
          onCheckedChange={(checked) =>
            updateBancada.mutate({ profileId: profile.id, bancadaExecutor: checked })
          }
        />
      </label>
      {showAppAccess && (
        <>
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className="text-foreground">Acesso no App</span>
            <Switch
              checked={profile.app_access_enabled}
              disabled={atLimit}
              onCheckedChange={(checked) =>
                updateAppAccess.mutate({ profileId: profile.id, enabled: checked })
              }
            />
          </label>
          {atLimit && (
            <p className="text-warning text-xs">
              Limite do plano atingido ({limit}) — libere o acesso de outro funcionário antes.
            </p>
          )}
        </>
      )}
      <p className="text-muted-foreground text-xs">
        Último acesso:{" "}
        {profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString("pt-BR") : "Nunca acessou"}
      </p>
    </div>
  )
}

function useInviteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      email: string
      fullName: string
      jobTitle: ProfileJobTitle | null
      bancadaIntake: boolean
      bancadaExecutor: boolean
    }) => {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Não foi possível convidar")
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }),
  })
}

function InviteEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [jobTitle, setJobTitle] = useState<ProfileJobTitle | null>(null)
  const [bancadaIntake, setBancadaIntake] = useState(false)
  const [bancadaExecutor, setBancadaExecutor] = useState(false)
  const invite = useInviteEmployee()

  async function handleInvite() {
    if (!email.trim()) {
      toast.error("Informe o e-mail do funcionário")
      return
    }
    try {
      await invite.mutateAsync({
        email: email.trim(),
        fullName: fullName.trim(),
        jobTitle,
        bancadaIntake,
        bancadaExecutor,
      })
      toast.success("Convite enviado! O funcionário recebe um e-mail pra criar a senha.")
      setOpen(false)
      setEmail("")
      setFullName("")
      setJobTitle(null)
      setBancadaIntake(false)
      setBancadaExecutor(false)
    } catch (error) {
      toast.error("Não foi possível convidar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="size-4" />
          Convidar funcionário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar funcionário</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>E-mail de acesso</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cargo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(JOB_TITLE_LABELS) as [ProfileJobTitle, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setJobTitle(value)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    jobTitle === value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              O cargo é só um rótulo — o acesso a cada módulo continua controlado pelos toggles abaixo, depois que o
              convite for aceito.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Bancada</Label>
            <p className="text-muted-foreground text-xs">
              Independente do cargo — define se esse funcionário aparece nos campos &quot;Recebido Por&quot; e
              &quot;Executor&quot; da Nova OS e do Orçamento.
            </p>
            <label className="border-border flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
              <span className="text-foreground">Responsável pela Entrada</span>
              <Switch checked={bancadaIntake} onCheckedChange={setBancadaIntake} />
            </label>
            <label className="border-border flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
              <span className="text-foreground">Executor de Reparos</span>
              <Switch checked={bancadaExecutor} onCheckedChange={setBancadaExecutor} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={invite.isPending}>
            {invite.isPending ? "Enviando..." : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TeamKpis({ members }: { members: ProfileRow[] }) {
  const { company } = useAuth()
  const limit = company ? PLAN_APP_ACCESS_LIMITS[company.plan] : 0
  const technicianCount = members.filter((m) => m.job_title === "tecnico").length
  const receptionistCount = members.filter((m) => m.job_title === "recepcionista").length
  const appAccessCount = members.filter((m) => m.role !== "owner" && m.app_access_enabled).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Equipe Total" value={String(members.length)} icon={Users} />
      <StatCard label="Técnicos" value={String(technicianCount)} icon={Wrench} />
      <StatCard label="Atendimento" value={String(receptionistCount)} icon={Headset} />
      <StatCard
        label="Acesso no App"
        value={`${appAccessCount}/${limit}`}
        icon={KeyRound}
        tone={appAccessCount >= limit ? "warning" : "default"}
      />
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
        actions={<InviteEmployeeDialog />}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <TeamKpis members={members ?? []} />

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
                  <div className="flex flex-col items-end gap-1">
                    {member.role === "owner" ? (
                      <StatusBadge tone="default">Dono</StatusBadge>
                    ) : (
                      <StatusBadge tone="muted">Funcionário</StatusBadge>
                    )}
                    {member.job_title && (
                      <StatusBadge tone="muted">{JOB_TITLE_LABELS[member.job_title]}</StatusBadge>
                    )}
                  </div>
                </div>

                <BancadaControls
                  profile={member}
                  allMembers={members ?? []}
                  showAppAccess={member.role !== "owner"}
                />

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
        </>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="team">
      <TeamPage />
    </ModuleGate>
  )
}
