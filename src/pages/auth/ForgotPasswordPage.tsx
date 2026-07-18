import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
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
import { requestPasswordReset } from "@/hooks/use-auth"
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth.schema"

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true)
    try {
      await requestPasswordReset(values.email, `${window.location.origin}/reset-password`)
      setSent(true)
    } catch (error) {
      toast.error("Não foi possível enviar o e-mail", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Enviamos um link de redefinição pro seu e-mail."
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <p className="text-muted-foreground text-sm">
          Se esse e-mail estiver cadastrado, você vai receber um link pra criar uma nova senha em
          instantes.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="voce@suaassistencia.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-2" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  )
}

export default ForgotPasswordPage
