"use client"

import { ShoppingCart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { SaleItemsEditor } from "@/components/app/Pos/SaleItemsEditor"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useClients } from "@/hooks/queries/use-clients"
import { useCreateSale, useTodaySales } from "@/hooks/queries/use-sales"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import type { SaleItemValues } from "@/lib/validators/sale.schema"
import type { PaymentMethod } from "@/types/domain"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function PosPage() {
  const { data: clients } = useClients()
  const { data: todaySales, isLoading } = useTodaySales()
  const createSale = useCreateSale()

  const [clientId, setClientId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [items, setItems] = useState<SaleItemValues[]>([])

  async function handleFinalize() {
    try {
      await createSale.mutateAsync({ clientId, serviceOrderId: null, paymentMethod, items })
      toast.success("Venda registrada!")
      setItems([])
      setClientId(null)
    } catch (error) {
      toast.error("Não foi possível registrar a venda", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  const todayTotal = (todaySales ?? []).reduce((sum, sale) => sum + sale.total_cents, 0)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="PDV" description="Venda de balcão, com ou sem OS vinculada." />

      <div className="border-border flex flex-col gap-4 rounded-2xl border p-5">
        <p className="text-foreground text-sm font-semibold">Nova venda</p>

        <div className="grid grid-cols-2 gap-3">
          <Select value={clientId ?? "__none__"} onValueChange={(v) => setClientId(v === "__none__" ? null : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cliente (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem cliente (balcão)</SelectItem>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SaleItemsEditor items={items} onItemsChange={setItems} />

        <Button
          className="gap-2 self-end"
          onClick={handleFinalize}
          disabled={createSale.isPending || items.length === 0}
        >
          <ShoppingCart className="size-4" />
          {createSale.isPending ? "Registrando..." : "Finalizar venda"}
        </Button>
      </div>

      <div className="border-border flex flex-col gap-3 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Vendas de hoje</p>
          <span className="text-success text-sm font-bold">{formatCents(todayTotal)}</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : !todaySales || todaySales.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Nenhuma venda hoje" description="As vendas do dia aparecem aqui." />
        ) : (
          <div className="flex flex-col divide-y">
            {todaySales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 text-sm">
                <StatusBadge tone={sale.status === "completed" ? "success" : "destructive"}>
                  {sale.payment_method ? PAYMENT_METHOD_LABELS[sale.payment_method] : "—"}
                </StatusBadge>
                <span className="text-foreground font-semibold">{formatCents(sale.total_cents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="pos">
      <PosPage />
    </ModuleGate>
  )
}
