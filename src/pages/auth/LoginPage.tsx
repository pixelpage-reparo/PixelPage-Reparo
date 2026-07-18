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
import { signInWithPassword } from "@/hooks/use-auth"
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth.schema"

function LoginPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true)
    try {
      await signInWithPassword(values.email, values.password)
      navigate("/app/dashboard")
    } catch (error) {
      toast.error("Não foi possível entrar", {
        description: error instanceof Error ? error.message : "Verifique seu e-mail e senha.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar na Bancada"
      description="Acesse o painel da sua assistência técnica."
      footer={
        <span className="text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Criar conta grátis
          </Link>
        </span>
      }
    >
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Senha</FormLabel>
                  <Link to="/forgot-password" className="text-primary text-xs font-medium hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default LoginPage
