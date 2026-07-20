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
import { useServicesCatalog } from "@/hooks/queries/use-services-catalog"
import type { ServiceOrderItemValues } from "@/lib/validators/service-order.schema"

interface ItemsFieldArrayProps {
  items: ServiceOrderItemValues[]
  onItemsChange: (items: ServiceOrderItemValues[]) => void
}

const CUSTOM_SERVICE_VALUE = "__custom__"

/**
 * Not wired through react-hook-form's useFieldArray on purpose — items mix
 * free-text (custom service), catalog-linked (service) and inventory-linked
 * (part) rows with different validation needs per row, so a plain
 * controlled array kept in the parent form's state is simpler to reason
 * about than a typed field array here.
 */
export function ItemsFieldArray({ items, onItemsChange }: ItemsFieldArrayProps) {
  const { data: inventoryItems } = useInventoryItems()
  const { data: servicesCatalog } = useServicesCatalog()

  function updateItem(index: number, patch: Partial<ItemsFieldArrayProps["items"][number]>) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  function addItem(kind: "service" | "part") {
    onItemsChange([
      ...items,
      {
        kind,
        inventory_item_id: null,
        services_catalog_id: null,
        description: "",
        quantity: 1,
        unit_price_cents: 0,
      },
    ])
  }

  const totalCents = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0)

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="border-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-start">
          <Select
            value={item.kind}
            onValueChange={(kind) =>
              updateItem(index, {
                kind: kind as "service" | "part",
                inventory_item_id: null,
                services_catalog_id: null,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Serviço</SelectItem>
              <SelectItem value="part">Peça</SelectItem>
            </SelectContent>
          </Select>

          {item.kind === "part" ? (
            <Select
              value={item.inventory_item_id ?? ""}
              onValueChange={(inventoryItemId) => {
                const inv = inventoryItems?.find((i) => i.id === inventoryItemId)
                updateItem(index, {
                  inventory_item_id: inventoryItemId,
                  description: inv?.name ?? item.description,
                  unit_price_cents: inv?.sale_price_cents ?? item.unit_price_cents,
                })
              }}
            >
              <SelectTrigger className="w-full flex-1">
                <SelectValue placeholder="Selecione a peça" />
              </SelectTrigger>
              <SelectContent>
                {(inventoryItems ?? []).map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name} ({inv.quantity} em estoque)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Select
                value={item.services_catalog_id ?? CUSTOM_SERVICE_VALUE}
                onValueChange={(value) => {
                  if (value === CUSTOM_SERVICE_VALUE) {
                    updateItem(index, { services_catalog_id: null })
                    return
                  }
                  const svc = servicesCatalog?.find((s) => s.id === value)
                  updateItem(index, {
                    services_catalog_id: value,
                    description: svc?.name ?? item.description,
                    unit_price_cents: svc?.default_price_cents ?? item.unit_price_cents,
                  })
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Buscar serviço..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM_SERVICE_VALUE}>+ Personalizado</SelectItem>
                  {(servicesCatalog ?? []).map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="flex-1"
                placeholder="Descrição do serviço"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
            </>
          )}

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
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addItem("part")}>
            <Plus className="size-3.5" />
            Adicionar Peça
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addItem("service")}>
            <Plus className="size-3.5" />
            + Personalizado
          </Button>
        </div>
        <span className="text-sm font-semibold">
          Total: {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>
    </div>
  )
}
