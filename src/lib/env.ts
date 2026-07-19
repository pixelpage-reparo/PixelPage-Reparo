import { z } from "zod"

/**
 * Client-side env only — anything server-only (STRIPE_SECRET_KEY,
 * STRIPE_WEBHOOK_SECRET, EVOLUTION_API_*) must never appear here. Vite only
 * exposes VITE_-prefixed vars to import.meta.env in the first place, so
 * this schema can't accidentally validate/leak a server secret even by
 * mistake — but the boundary is enforced here explicitly too, for clarity.
 */
const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .min(1, "VITE_SUPABASE_URL está ausente ou vazia")
    .url("VITE_SUPABASE_URL não é uma URL válida"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY está ausente ou vazia"),
  // Stripe isn't wired up yet (see lib/billing/index.ts and api/stripe-webhook.ts),
  // so its client-side key is intentionally optional — booting the app
  // shouldn't require a Stripe account to exist yet.
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
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
 * Validates required VITE_* env vars. Throws EnvValidationError with a
 * message listing every missing/invalid variable — the goal is a loud,
 * immediate, readable failure instead of the app quietly trying to run and
 * getting stuck on a loading state because Supabase calls fail silently.
 */
export function validateEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse(import.meta.env)

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
 * Validated env, cached after the first call. main.tsx calls this first
 * (before dynamically importing the rest of the app) so a bad/missing
 * config fails right there with a clear on-screen message; any other
 * module (e.g. lib/supabase/client.ts) that calls this afterward just
 * gets the same cached, already-valid result instead of re-parsing.
 */
export function getEnv(): ClientEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}
