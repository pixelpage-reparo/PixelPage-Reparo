import type {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  CreatePortalSessionParams,
  CreatePortalSessionResult,
} from "@/lib/billing/types"

/**
 * Stripe Checkout is the target subscription gateway (hosted checkout, no
 * raw card data ever touches this app) — but it isn't wired up yet. This
 * module exists purely as the integration point future work plugs into:
 * a real implementation will call a Supabase Edge Function that creates
 * the Checkout Session server-side with the secret key, and returns the
 * hosted URL to redirect to.
 *
 * TODO(stripe-integration): implement once a live Supabase project + Stripe
 * account are connected. Until then, this intentionally throws instead of
 * silently no-oping, so a premature call fails loudly during development.
 */
export async function createCheckoutSession(
  _params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResult> {
  throw new Error(
    "Stripe ainda não está integrado. createCheckoutSession() é um stub — implemente a Edge Function de checkout antes de usar."
  )
}

/** TODO(stripe-integration): same as createCheckoutSession — billing portal for an existing subscriber. */
export async function createPortalSession(
  _params: CreatePortalSessionParams
): Promise<CreatePortalSessionResult> {
  throw new Error(
    "Stripe ainda não está integrado. createPortalSession() é um stub — implemente a Edge Function do portal antes de usar."
  )
}
