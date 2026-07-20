import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { encryptDeviceSecret } from "@/lib/server/device-secret"

const TABLES = { service_order: "service_orders", quote: "quotes" } as const
type OrderType = keyof typeof TABLES

/**
 * Encrypts and stores the device unlock PIN/pattern. The client only ever
 * sends the plaintext once, over this request — it's never written to
 * Postgres directly by client code (see the wizards in
 * app/app/service-orders/new and app/app/quotes/new), and the ciphertext
 * that comes back out is useless without DEVICE_SECRET_ENCRYPTION_KEY, which
 * never leaves this server.
 *
 * Authorization here is the same as any other field on the order: whatever
 * company member could already update service_orders/quotes via RLS can set
 * this one too (this route uses the caller's own cookie-bound session, not
 * the service-role key, so RLS still applies). The stricter "only the
 * assigned technician or the owner" check lives on the read side
 * (./reveal/route.ts) — this row is being created/edited at intake, often by
 * whoever received the device, not necessarily the technician who'll later
 * repair it.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const orderType = body?.orderType as OrderType | undefined
  const orderId = typeof body?.orderId === "string" ? body.orderId : ""
  const lockValue = typeof body?.lockValue === "string" ? body.lockValue : ""

  if (!orderType || !TABLES[orderType] || !orderId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }
  if (!lockValue.trim()) {
    return NextResponse.json({ error: "Nenhum valor para armazenar" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  let encrypted: string
  try {
    encrypted = encryptDeviceSecret(lockValue)
  } catch (error) {
    console.error("[device-secret] Falha ao cifrar:", error)
    return NextResponse.json({ error: "Criptografia não configurada no servidor" }, { status: 500 })
  }

  const table = TABLES[orderType]
  const { data, error } = await supabase
    .from(table)
    .update({ device_unlock_secret_encrypted: encrypted })
    .eq("id", orderId)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: "Não foi possível salvar — verifique se você tem acesso a este registro" },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true })
}
