import { z } from "zod"

/**
 * Client-side env only — anything server-only (STRIPE_SECRET_KEY,
 * STRIPE_WEBHOOK_SECRET, EVOLUTION_API_*) must never appear here. Next.js
 * only inlines NEXT_PUBLIC_-prefixed vars into the client bundle, and only
 * when referenced as a literal `process.env.NEXT_PUBLIC_X` (its compiler
 * does static replacement, not a dynamic object) — so each one is spelled
 * out explicitly below rather than looped over.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL está ausente ou vazia")
    .url("NEXT_PUBLIC_SUPABASE_URL não é uma URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY está ausente ou vazia"),
  // Stripe isn't wired up yet (see lib/billing/index.ts and
  // app/api/stripe/webhook/route.ts), so its client-side key is
  // intentionally optional — booting the app shouldn't require a Stripe
  // account to exist yet.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EnvValidationError"
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  • ${issue.path.join(".") || "(raiz)"}: ${issue.message}`).join("\n")
}

/**
 * Validates required NEXT_PUBLIC_* env vars. Throws EnvValidationError with
 * a message listing every missing/invalid variable — the goal is a loud,
 * immediate, readable failure instead of the app quietly trying to run and
 * getting stuck on a loading state because Supabase calls fail silently.
 */
export function validateEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  })

  if (!result.success) {
    const message = [
      "Configuração de ambiente ausente ou inválida:",
      "",
      formatIssues(result.error),
      "",
      "Copie .env.example para .env.local e preencha os valores do seu",
      "projeto Supabase (Project Settings → API no painel do Supabase).",
    ].join("\n")

    throw new EnvValidationError(message)
  }

  return result.data
}

let cachedEnv: ClientEnv | undefined

/**
 * Validated env, cached after the first call. Called at module scope by
 * lib/supabase/{client,server}.ts so a bad/missing config fails loudly and
 * immediately (surfaces as Next's own error overlay in dev / a 500 in prod)
 * instead of the app quietly rendering and every query hanging later.
 */
export function getEnv(): ClientEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}
