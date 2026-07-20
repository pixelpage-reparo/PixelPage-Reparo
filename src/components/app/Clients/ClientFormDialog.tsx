import { zodResolver } from "@hookform/resolvers/zod"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateClient, useUpdateClient } from "@/hooks/queries/use-clients"
import { clientFormSchema, type ClientFormValues } from "@/lib/validators/client.schema"
import type { Database } from "@/lib/supabase/types"

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]

interface ClientFormDialogProps {
  trigger: ReactNode
  client?: ClientRow
}

export function ClientFormDialog({ trigger, client }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isEdit = !!client

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      full_name: client?.full_name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      document: client?.document ?? "",
      birth_date: client?.birth_date ?? "",
      notes: client?.notes ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        full_name: client?.full_name ?? "",
        phone: client?.phone ?? "",
        email: client?.email ?? "",
        document: client?.document ?? "",
        birth_date: client?.birth_date ?? "",
        notes: client?.notes ?? "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: ClientFormValues) {
    try {
      const payload = { ...values, email: values.email || null, birth_date: values.birth_date || null }
      if (isEdit && client) {
        await updateClient.mutateAsync({ id: client.id, ...payload })
        toast.success("Cliente atualizado")
      } else {
        await createClient.mutateAsync(payload)
        toast.success("Cliente cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error("Não foi possível salvar o cliente", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opcional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
