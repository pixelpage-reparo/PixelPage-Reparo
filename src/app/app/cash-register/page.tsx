"use client"

import { Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCashSessionHistory,
  useCloseCashSession,
  useCurrentCashSession,
  useOpenCashSession,
} from "@/hooks/queries/use-cash-register"
import { useTeamMembers } from "@/hooks/queries/use-team"
import { useAuth } from "@/hooks/use-auth"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function OpenCashForm() {
  const { profile } = useAuth()
  const { data: teamMembers } = useTeamMembers()
  const openSession = useOpenCashSession()
  const [responsibleId, setResponsibleId] = useState(profile?.id ?? "")
  const [startingFloat, setStartingFloat] = useState(0)

  async function handleOpen() {
    try {
      await openSession.mutateAsync({ startingFloatCents: startingFloat, openedByProfileId: responsibleId })
      toast.success("Caixa aberto!")
    } catch (error) {
      toast.error("Não foi possível abrir o caixa", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <EmptyState icon={Wallet} title="Nenhum caixa aberto" description="Abra o caixa pra começar o turno." />

      <div className="flex flex-col gap-1.5">
        <Label>Responsável pela Abertura</Label>
        <Select value={responsibleId} onValueChange={setResponsibleId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(teamMembers ?? []).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name} {member.role === "owner" ? "(Dono)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Valor Inicial (Troco)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={startingFloat / 100}
          onChange={(e) => setStartingFloat(Math.round(Number(e.target.value) * 100) || 0)}
        />
      </div>

      <Button onClick={handleOpen} disabled={openSession.isPending || !responsibleId}>
        {openSession.isPending ? "Abrindo..." : "Abrir Caixa"}
      </Button>
    </div>
  )
}

function OpenCashSummary({ session }: { session: NonNullable<ReturnType<typeof useCurrentCashSession>["data"]> }) {
  const closeSession = useCloseCashSession()
  const [countedTotal, setCountedTotal] = useState(0)
  const [closing, setClosing] = useState(false)

  async function handleClose() {
    try {
      const result = await closeSession.mutateAsync({ sessionId: session.id, countedTotalCents: countedTotal })
      toast.success(
        result.discrepancyCents === 0
          ? "Caixa fechado — bateu certinho!"
          : `Caixa fechado — diferença de ${formatCents(result.discrepancyCents)}`
      )
      setClosing(false)
    } catch (error) {
      toast.error("Não foi possível fechar o caixa", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground text-sm font-semibold">Caixa aberto</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Aberto em</span>
          <span className="text-foreground">{new Date(session.opened_at).toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Troco inicial</span>
          <span className="text-foreground font-medium">{formatCents(session.starting_float_cents)}</span>
        </div>
      </div>

      {!closing ? (
        <Button variant="destructive" onClick={() => setClosing(true)}>
          Fechar Caixa
        </Button>
      ) : (
        <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
          <Label>Valor Contado (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={countedTotal / 100}
            onChange={(e) => setCountedTotal(Math.round(Number(e.target.value) * 100) || 0)}
          />
          <p className="text-muted-foreground text-xs">
            Só dinheiro em espécie entra na conferência — Pix e cartão aparecem no relatório do turno, sem exigir
            contagem física.
          </p>
          <Button onClick={handleClose} disabled={closeSession.isPending}>
            {closeSession.isPending ? "Fechando..." : "Confirmar Fechamento"}
          </Button>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { data: history, isLoading } = useCashSessionHistory()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return <EmptyState icon={Wallet} title="Nenhum caixa fechado ainda" description="O histórico aparece aqui." />
  }

  return (
    <div className="border-border overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fechado em</TableHead>
            <TableHead>Troco inicial</TableHead>
            <TableHead>Esperado</TableHead>
            <TableHead>Contado</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{session.closed_at ? new Date(session.closed_at).toLocaleString("pt-BR") : "—"}</TableCell>
              <TableCell>{formatCents(session.starting_float_cents)}</TableCell>
              <TableCell>{formatCents(session.expected_total_cents ?? 0)}</TableCell>
              <TableCell>{formatCents(session.counted_total_cents ?? 0)}</TableCell>
              <TableCell
                className={`text-right font-medium ${(session.discrepancy_cents ?? 0) === 0 ? "text-success" : "text-destructive"}`}
              >
                {formatCents(session.discrepancy_cents ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CashRegisterPage() {
  const { data: currentSession, isLoading } = useCurrentCashSession()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Caixa" description="Abertura e fechamento de turno." />

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Caixa Atual</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          {isLoading ? (
            <div className="mx-auto max-w-sm">
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : currentSession ? (
            <OpenCashSummary session={currentSession} />
          ) : (
            <OpenCashForm />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="cash_register">
      <CashRegisterPage />
    </ModuleGate>
  )
}
