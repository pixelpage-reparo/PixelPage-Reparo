// ============================================================================
// ⚠️  NÃO CONECTADO / NÃO TESTADO AINDA.
//
// Esta rota ainda não foi cadastrada como endpoint no Dashboard da Stripe,
// não foi implantada, e não foi testada nem localmente (nem via `stripe
// listen --forward-to`). STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET em
// .env.local estão vazias de propósito. Só a validação de assinatura está
// implementada de verdade — a lógica de negócio de cada evento é só TODO.
// Não trate esta rota como parte da integração de billing até que ela seja
// explicitamente conectada e testada.
// ============================================================================

import Stripe from "stripe"

// Vercel Function no runtime Edge — assinatura Request/Response padrão da
// Web API, compatível com `stripe.webhooks.constructEventAsync` (que usa
// Web Crypto, sem depender do módulo `crypto` do Node).
export const config = {
  runtime: "edge",
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || !webhookSecret) {
    console.error(
      "[stripe-webhook] STRIPE_SECRET_KEY e/ou STRIPE_WEBHOOK_SECRET não configuradas — recusando requisição."
    )
    return new Response("Webhook not configured", { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  // Corpo bruto, sem parse — a assinatura é calculada sobre os bytes exatos
  // enviados pela Stripe. Qualquer JSON.parse() antes disso invalidaria a verificação.
  const rawBody = await request.text()

  const stripe = new Stripe(stripeSecretKey)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error("[stripe-webhook] Falha na verificação da assinatura:", error)
    return new Response("Webhook signature verification failed", { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // TODO: assinatura confirmada — marcar a companies correspondente
      // como plan='active' e gravar stripe_customer_id/stripe_subscription_id
      // via fn_update_company_billing() (ver supabase/migrations/0014_rls_policies.sql).
      break
    }

    case "customer.subscription.updated": {
      // TODO: sincronizar mudança de status/plano da assinatura (ex:
      // past_due, trial ending) com companies.plan via fn_update_company_billing().
      break
    }

    case "customer.subscription.deleted": {
      // TODO: assinatura cancelada — marcar companies.plan='canceled' via
      // fn_update_company_billing().
      break
    }

    default: {
      // TODO: eventos não tratados explicitamente são apenas ignorados por enquanto.
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
