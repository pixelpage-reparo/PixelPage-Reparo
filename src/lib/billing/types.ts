export interface CreateCheckoutSessionParams {
  companyId: string
  /** Stripe Price id for the plan being purchased. */
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutSessionResult {
  checkoutUrl: string
}

export interface CreatePortalSessionParams {
  companyId: string
  returnUrl: string
}

export interface CreatePortalSessionResult {
  portalUrl: string
}
