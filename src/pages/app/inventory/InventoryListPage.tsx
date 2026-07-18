import { Pencil, Package, Plus } from "lucide-react"

import { AdjustStockDialog } from "@/components/app/Inventory/AdjustStockDialog"
import { InventoryItemFormDialog } from "@/components/app/Inventory/InventoryItemFormDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useInventoryItems } from "@/hooks/queries/use-inventory"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function InventoryListPage() {
  const { data: items, isLoading } = useInventoryItems()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estoque"
        description="Baixa automática e alerta antes de faltar peça."
        actions={
          <InventoryItemFormDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Novo item
              </Button>
            }
          />
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum item cadastrado"
          description="Cadastre as peças que você mais usa pra começar a baixa automática."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isLow = item.quantity <= item.min_quantity_alert
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={item.quantity === 0 ? "destructive" : isLow ? "warning" : "success"}>
                        {item.quantity} {item.unit}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{formatCents(item.sale_price_cents)}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <AdjustStockDialog
                        inventoryItemId={item.id}
                        itemName={item.name}
                        currentQuantity={item.quantity}
                      />
                      <InventoryItemFormDialog
                        item={item}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar item">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default InventoryListPage
