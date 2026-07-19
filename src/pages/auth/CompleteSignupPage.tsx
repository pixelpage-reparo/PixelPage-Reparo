import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { refreshProfile, useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import {
  completeSignupSchema,
  type CompleteSignupFormValues,
} from "@/lib/validators/auth.schema"

function CompleteSignupPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const metadata = session?.user.user_metadata as Record<string, unknown> | undefined
  const suggestedFullName =
    (metadata?.full_name as string | undefined) ?? (metadata?.name as string | undefined) ?? ""

  const form = useForm<CompleteSignupFormValues>({
    resolver: zodResolver(completeSignupSchema),
    defaultValues: { companyName: "", fullName: suggestedFullName },
  })

  async function onSubmit(values: CompleteSignupFormValues) {
    if (!session?.user) return

    setSubmitting(true)
    try {
      const { error } = await supabase.rpc("fn_create_company_and_owner", {
        p_company_name: values.companyName,
        p_full_name: values.fullName,
      })
      if (error) throw error

      await refreshProfile(session.user.id)
      navigate("/app/dashboard")
    } catch (error) {
      toast.error("Não foi possível concluir seu cadastro", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Só mais um passo"
      description="Conte pra gente o nome da sua assistência técnica pra continuar."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da sua assistência</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TecCel Assistência" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu nome</FormLabel>
                <FormControl>
                  <Input placeholder="Como você se chama" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting ? "Criando..." : "Concluir cadastro"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default CompleteSignupPage
