import { createClient as createServiceRoleClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { DEVICE_UNLOCK_RETENTION_DAYS } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"

/**
 * Purges service_orders/quotes.device_unlock_secret_encrypted once the
 * order has been settled for DEVICE_UNLOCK_RETENTION_DAYS days —
 * service_orders when status = 'delivered' (delivered_at is the anchor),
 * quotes when status = 'convertido' (converted_at is the anchor).
 *
 * Triggered by Vercel Cron (see vercel.json's `crons` entry) instead of
 * pg_cron — see the note in 0028_device_unlock_secret.sql for why. This
 * needs the service-role key because it has to touch rows across every
 * company in one sweep; there's no per-user session driving a cron
 * trigger, so ordinary RLS-scoped queries can't do this job.
 *
 * Vercel adds `Authorization: Bearer ${CRON_SECRET}` automatically to
 * requests it sends here, as long as CRON_SECRET is set as an env var —
 * this route rejects anything else, so the URL being guessable isn't
 * enough to trigger it.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[cron/purge-device-secrets] SUPABASE_SERVICE_ROLE_KEY não configurada — recusando requisição.")
    return NextResponse.json({ error: "Não configurado no servidor" }, { status: 500 })
  }

  const admin = createServiceRoleClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const cutoffIso = new Date(Date.now() - DEVICE_UNLOCK_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: purgedServiceOrders, error: serviceOrdersError } = await admin
    .from("service_orders")
    .update({ device_unlock_secret_encrypted: null })
    .eq("status", "delivered")
    .not("device_unlock_secret_encrypted", "is", null)
    .lte("delivered_at", cutoffIso)
    .select("id")

  const { data: purgedQuotes, error: quotesError } = await admin
    .from("quotes")
    .update({ device_unlock_secret_encrypted: null })
    .eq("status", "convertido")
    .not("device_unlock_secret_encrypted", "is", null)
    .lte("converted_at", cutoffIso)
    .select("id")

  if (serviceOrdersError || quotesError) {
    console.error("[cron/purge-device-secrets] Falha ao purgar:", serviceOrdersError ?? quotesError)
    return NextResponse.json({ error: "Falha ao purgar" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    purged: {
      service_orders: purgedServiceOrders?.length ?? 0,
      quotes: purgedQuotes?.length ?? 0,
    },
  })
}
