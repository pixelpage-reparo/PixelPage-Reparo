import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
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
import { signUpWithPassword } from "@/hooks/use-auth"
import { signupSchema, type SignupFormValues } from "@/lib/validators/auth.schema"

function SignupPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { companyName: "", fullName: "", email: "", password: "" },
  })

  async function onSubmit(values: SignupFormValues) {
    setSubmitting(true)
    try {
      const result = await signUpWithPassword(
        values.email,
        values.password,
        values.companyName,
        values.fullName
      )

      if (result.needsEmailConfirmation) {
        toast.success("Quase lá!", {
          description: "Confirme seu e-mail para ativar a conta e depois faça login.",
        })
        navigate("/login")
        return
      }

      navigate("/app/dashboard")
    } catch (error) {
      toast.error("Não foi possível criar sua conta", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Testar a Bancada grátis"
      description="7 dias de teste. Sem cartão de crédito agora."
      footer={
        <span className="text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </span>
      }
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Pelo menos 6 caracteres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting ? "Criando conta..." : "Criar conta grátis"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default SignupPage
