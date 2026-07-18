import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
import { useAdjustInventoryStock } from "@/hooks/queries/use-inventory"

interface AdjustStockDialogProps {
  inventoryItemId: string
  itemName: string
  currentQuantity: number
}

export function AdjustStockDialog({ inventoryItemId, itemName, currentQuantity }: AdjustStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState(0)
  const adjustStock = useAdjustInventoryStock()

  async function handleAdjust() {
    if (delta === 0) {
      toast.error("Informe uma quantidade diferente de zero")
      return
    }
    if (currentQuantity + delta < 0) {
      toast.error("Isso deixaria o estoque negativo")
      return
    }
    try {
      await adjustStock.mutateAsync({ inventoryItemId, delta })
      toast.success("Estoque ajustado")
      setOpen(false)
      setDelta(0)
    } catch (error) {
      toast.error("Não foi possível ajustar o estoque", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ajustar estoque">
          <SlidersHorizontal className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar estoque — {itemName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">Quantidade atual: {currentQuantity}</p>
          <Label htmlFor="delta">Ajuste (use negativo pra retirar)</Label>
          <Input
            id="delta"
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value) || 0)}
          />
          <p className="text-muted-foreground text-xs">Nova quantidade: {currentQuantity + delta}</p>
        </div>
        <DialogFooter>
          <Button onClick={handleAdjust} disabled={adjustStock.isPending}>
            {adjustStock.isPending ? "Ajustando..." : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
