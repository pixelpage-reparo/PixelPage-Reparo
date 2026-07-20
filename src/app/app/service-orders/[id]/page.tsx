"use client"

import { Camera, FileText, Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { DeviceSecretCard } from "@/components/app/DeviceSecretCard"
import { ModuleGate } from "@/components/app/ModuleGate"
import { StatusSelect } from "@/components/app/ServiceOrders/StatusSelect"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useClient } from "@/hooks/queries/use-clients"
import {
  useAddServiceOrderItem,
  useServiceOrder,
  useServiceOrderItems,
  useServiceOrderStatusHistory,
  useUpdateServiceOrderStatus,
} from "@/hooks/queries/use-service-orders"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_TONE } from "@/lib/constants"
import type { ServiceOrderItemValues } from "@/lib/validators/service-order.schema"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function AddItemDialog({ serviceOrderId }: { serviceOrderId: string }) {
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<ServiceOrderItemValues>({
    kind: "service",
    inventory_item_id: null,
    description: "",
    quantity: 1,
    unit_price_cents: 0,
  })
  const addItem = useAddServiceOrderItem(serviceOrderId)

  async function handleAdd() {
    if (!item.description.trim()) {
      toast.error("Descreva o item antes de adicionar")
      return
    }
    try {
      await addItem.mutateAsync(item)
      setOpen(false)
      setItem({ kind: "service", inventory_item_id: null, description: "", quantity: 1, unit_price_cents: 0 })
    } catch (error) {
      toast.error("Não foi possível adicionar o item", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-3.5" />
          Adicionar item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar item à OS</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Select value={item.kind} onValueChange={(kind) => setItem({ ...item, kind: kind as "service" | "part" })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Serviço</SelectItem>
              <SelectItem value="part">Peça</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Descrição"
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={1}
              placeholder="Quantidade"
              value={item.quantity}
              onChange={(e) => setItem({ ...item, quantity: Number(e.target.value) || 1 })}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Valor (R$)"
              value={item.unit_price_cents / 100}
              onChange={(e) =>
                setItem({ ...item, unit_price_cents: Math.round(Number(e.target.value) * 100) || 0 })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={addItem.isPending}>
            {addItem.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ServiceOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: serviceOrder, isLoading } = useServiceOrder(id)
  const { data: items } = useServiceOrderItems(id)
  const { data: statusHistory } = useServiceOrderStatusHistory(id)
  const { data: client } = useClient(serviceOrder?.client_id ?? undefined)
  const updateStatus = useUpdateServiceOrderStatus()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!serviceOrder || !id) {
    return (
      <EmptyState icon={FileText} title="OS não encontrada" description="Ela pode ter sido removida." />
    )
  }

  const checklist = serviceOrder.checklist as Record<string, unknown>

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={`OS #${serviceOrder.os_number}`}
        description={client?.full_name ?? "Sem cliente vinculado"}
        actions={
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.info("Geração de PDF/link entra numa fase futura.")}
          >
            <FileText className="size-4" />
            Gerar PDF/link
          </Button>
        }
      />

      <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Status</p>
          <div className="w-48">
            <StatusSelect
              value={serviceOrder.status}
              onChange={(status) => updateStatus.mutate({ id, status })}
            />
          </div>
        </div>

        <p className="text-muted-foreground text-sm">{serviceOrder.reported_issue}</p>

        <div className="flex flex-wrap gap-2">
          {(["screen_ok", "camera_ok", "audio_ok", "connectivity_ok"] as const).map((key) => (
            <StatusBadge key={key} tone={checklist[key] ? "success" : "destructive"}>
              {{ screen_ok: "Tela", camera_ok: "Câmera", audio_ok: "Áudio", connectivity_ok: "Conectividade" }[key]}
            </StatusBadge>
          ))}
        </div>
      </div>

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Itens</p>
          <AddItemDialog serviceOrderId={id} />
        </div>
        {!items || items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum item lançado ainda.</p>
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
      </div>

      {serviceOrder.has_device_unlock_secret && (
        <DeviceSecretCard
          orderType="service_order"
          orderId={id}
          assignedTo={serviceOrder.assigned_to}
        />
      )}

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground text-sm font-semibold">Fotos</p>
        <EmptyState
          icon={Camera}
          title="Upload de fotos em breve"
          description="O envio de fotos do checklist entra quando o Storage estiver conectado a um projeto real."
        />
      </div>

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <p className="text-foreground text-sm font-semibold">Histórico de status</p>
        <div className="flex flex-col gap-3">
          {(statusHistory ?? []).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 text-sm">
              <StatusBadge tone={SERVICE_ORDER_STATUS_TONE[entry.status]}>
                {SERVICE_ORDER_STATUS_LABELS[entry.status]}
              </StatusBadge>
              <span className="text-muted-foreground text-xs">
                {new Date(entry.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="service_orders">
      <ServiceOrderDetailPage />
    </ModuleGate>
  )
}
