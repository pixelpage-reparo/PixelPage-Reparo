"use client"

import { ArrowRightCircle, FileText } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { DeviceSecretCard } from "@/components/app/DeviceSecretCard"
import { ModuleGate } from "@/components/app/ModuleGate"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useClient } from "@/hooks/queries/use-clients"
import {
  useConvertQuoteToServiceOrder,
  useQuote,
  useQuoteItems,
  useUpdateQuoteStatus,
} from "@/hooks/queries/use-quotes"
import { useTeamMembers } from "@/hooks/queries/use-team"
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE } from "@/lib/constants"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function QuoteDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { data: quote, isLoading } = useQuote(id)
  const { data: items } = useQuoteItems(id)
  const { data: client } = useClient(quote?.client_id ?? undefined)
  const { data: teamMembers } = useTeamMembers()
  const updateStatus = useUpdateQuoteStatus()
  const convertToOs = useConvertQuoteToServiceOrder()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!quote) {
    return <EmptyState icon={FileText} title="Orçamento não encontrado" description="Ele pode ter sido removido." />
  }

  async function handleConvert() {
    try {
      const serviceOrder = await convertToOs.mutateAsync(id)
      toast.success("Orçamento convertido em OS!")
      router.push(`/app/service-orders/${serviceOrder.id}`)
    } catch (error) {
      toast.error("Não foi possível converter em OS", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={`Orçamento #${quote.quote_number}`}
        description={client?.full_name ?? "Sem cliente vinculado"}
        actions={
          quote.status === "aprovado" ? (
            <Button className="gap-1.5" onClick={handleConvert} disabled={convertToOs.isPending}>
              <ArrowRightCircle className="size-4" />
              {convertToOs.isPending ? "Convertendo..." : "Converter em OS"}
            </Button>
          ) : undefined
        }
      />

      <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Status</p>
          <StatusBadge tone={QUOTE_STATUS_TONE[quote.status]}>{QUOTE_STATUS_LABELS[quote.status]}</StatusBadge>
        </div>

        {quote.status !== "convertido" && (
          <div className="flex flex-wrap gap-2">
            {(["pendente", "enviado", "aprovado", "recusado"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={quote.status === status ? "default" : "outline"}
                onClick={() => updateStatus.mutate({ id, status })}
              >
                {QUOTE_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        )}

        {quote.device_description && (
          <p className="text-foreground text-sm font-medium">{quote.device_description}</p>
        )}
        {quote.reported_issue && <p className="text-muted-foreground text-sm">{quote.reported_issue}</p>}
        {quote.notes && <p className="text-muted-foreground text-sm">{quote.notes}</p>}

        {Array.isArray((quote.checklist as { physical_tags?: string[] })?.physical_tags) &&
          (quote.checklist as { physical_tags: string[] }).physical_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(quote.checklist as { physical_tags: string[] }).physical_tags.map((tag) => (
                <StatusBadge key={tag} tone="warning">
                  {tag}
                </StatusBadge>
              ))}
            </div>
          )}
      </div>

      {(quote.technician_diagnosis || quote.received_by || quote.assigned_to) && (
        <div className="border-border flex flex-col gap-2 rounded-2xl border p-5 text-sm">
          {quote.technician_diagnosis && (
            <div>
              <p className="text-muted-foreground text-xs">Laudo</p>
              <p className="text-foreground">{quote.technician_diagnosis}</p>
            </div>
          )}
          {quote.received_by && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recebido Por</span>
              <span className="text-foreground font-medium">
                {teamMembers?.find((m) => m.id === quote.received_by)?.full_name ?? "—"}
              </span>
            </div>
          )}
          {quote.assigned_to && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Executor</span>
              <span className="text-foreground font-medium">
                {teamMembers?.find((m) => m.id === quote.assigned_to)?.full_name ?? "—"}
              </span>
            </div>
          )}
        </div>
      )}

      {quote.has_device_unlock_secret && (
        <DeviceSecretCard orderType="quote" orderId={id} assignedTo={quote.assigned_to} />
      )}

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground text-sm font-semibold">Itens</p>
        {!items || items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum item neste orçamento.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-foreground font-medium">{item.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.kind === "part" ? "Peça" : "Serviço"} · {item.quantity}x
                  </p>
                </div>
                <span className="text-foreground font-semibold">{formatCents(item.total_cents)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-border flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Desconto</span>
          <span className="text-foreground font-medium">{formatCents(quote.discount_cents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-semibold">Total</span>
          <span className="text-foreground font-bold">{formatCents(quote.total_cents)}</span>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="quotes">
      <QuoteDetailPage />
    </ModuleGate>
  )
}
