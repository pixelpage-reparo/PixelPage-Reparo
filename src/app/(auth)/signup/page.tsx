"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth/AuthLayout"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
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
import { PasswordInput } from "@/components/ui/password-input"
import { signUpWithPassword } from "@/hooks/use-auth"
import { signupSchema, type SignupFormValues } from "@/lib/validators/auth.schema"

export default function SignupPage() {
  const router = useRouter()
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
        router.push("/login")
        return
      }

      router.push("/app/dashboard")
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
          <Link href="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </span>
      }
    >
      <GoogleSignInButton label="Criar conta com Google" />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">ou</span>
        </div>
      </div>

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
                  <PasswordInput placeholder="Pelo menos 6 caracteres" {...field} />
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
