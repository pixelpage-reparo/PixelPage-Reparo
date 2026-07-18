import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useInventoryItems } from "@/hooks/queries/use-inventory"
import type { SaleItemValues } from "@/lib/validators/sale.schema"

interface SaleItemsEditorProps {
  items: SaleItemValues[]
  onItemsChange: (items: SaleItemValues[]) => void
}

export function SaleItemsEditor({ items, onItemsChange }: SaleItemsEditorProps) {
  const { data: inventoryItems } = useInventoryItems()

  function updateItem(index: number, patch: Partial<SaleItemValues>) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onItemsChange([...items, { inventory_item_id: null, description: "", quantity: 1, unit_price_cents: 0 }])
  }

  const totalCents = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0)

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center"
        >
          <Select
            value={item.inventory_item_id ?? "__custom__"}
            onValueChange={(value) => {
              if (value === "__custom__") {
                updateItem(index, { inventory_item_id: null })
                return
              }
              const inv = inventoryItems?.find((i) => i.id === value)
              updateItem(index, {
                inventory_item_id: value,
                description: inv?.name ?? item.description,
                unit_price_cents: inv?.sale_price_cents ?? item.unit_price_cents,
              })
            }}
          >
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Selecione um item ou digite abaixo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__custom__">Item avulso</SelectItem>
              {(inventoryItems ?? []).map((inv) => (
                <SelectItem key={inv.id} value={inv.id}>
                  {inv.name} ({inv.quantity} em estoque)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="flex-1"
            placeholder="Descrição"
            value={item.description}
            onChange={(e) => updateItem(index, { description: e.target.value })}
          />

          <Input
            type="number"
            min={1}
            className="w-full sm:w-20"
            placeholder="Qtd"
            value={item.quantity}
            onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
          />

          <Input
            type="number"
            min={0}
            step="0.01"
            className="w-full sm:w-28"
            placeholder="Valor (R$)"
            value={item.unit_price_cents / 100}
            onChange={(e) => updateItem(index, { unit_price_cents: Math.round(Number(e.target.value) * 100) || 0 })}
          />

          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
          <Plus className="size-3.5" />
          Adicionar item
        </Button>
        <span className="text-sm font-semibold">
          Total: {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>
    </div>
  )
}
