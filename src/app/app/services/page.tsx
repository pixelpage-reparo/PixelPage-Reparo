"use client"

import { Pencil, Plus, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import { ModuleGate } from "@/components/app/ModuleGate"
import { ServiceItemFormDialog } from "@/components/app/Services/ServiceItemFormDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
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
import {
  useDeactivateServiceCatalogItem,
  useServicesCatalog,
} from "@/hooks/queries/use-services-catalog"

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function ServicesCatalogPage() {
  const { data: items, isLoading } = useServicesCatalog()
  const deactivate = useDeactivateServiceCatalogItem()

  async function handleRemove(id: string) {
    try {
      await deactivate.mutateAsync(id)
      toast.success("Serviço removido do catálogo")
    } catch (error) {
      toast.error("Não foi possível remover o serviço", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Serviços"
        description="Tabela de preços usada nos orçamentos, OS e PDV."
        actions={
          <ServiceItemFormDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Novo serviço
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
          icon={Wrench}
          title="Nenhum serviço cadastrado"
          description="Cadastre os serviços que você mais realiza pra agilizar orçamentos e OS."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço padrão</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.estimated_duration_minutes ? `${item.estimated_duration_minutes} min` : "—"}
                  </TableCell>
                  <TableCell>{formatCents(item.default_price_cents)}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <ServiceItemFormDialog
                      item={item}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar serviço">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover serviço"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ModuleGate module="services_catalog">
      <ServicesCatalogPage />
    </ModuleGate>
  )
}
