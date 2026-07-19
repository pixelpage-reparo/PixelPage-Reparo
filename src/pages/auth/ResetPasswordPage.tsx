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
import { PasswordInput } from "@/components/ui/password-input"
import { updatePassword } from "@/hooks/use-auth"
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth.schema"

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitting(true)
    try {
      await updatePassword(values.password)
      toast.success("Senha atualizada!")
      navigate("/login")
    } catch (error) {
      toast.error("Não foi possível atualizar a senha", {
        description: error instanceof Error ? error.message : "O link pode ter expirado — peça um novo.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Criar nova senha" description="Escolha uma nova senha pra sua conta.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Pelo menos 6 caracteres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirme a nova senha</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Repita a senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
