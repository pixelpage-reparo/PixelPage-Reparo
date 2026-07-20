import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { decryptDeviceSecret } from "@/lib/server/device-secret"
import { DEVICE_UNLOCK_RETENTION_DAYS } from "@/lib/constants"

type OrderType = "service_order" | "quote"

const RETENTION_MS = DEVICE_UNLOCK_RETENTION_DAYS * 24 * 60 * 60 * 1000

/**
 * Decrypts and returns the device unlock PIN/pattern — the only place in
 * the app that ever sees the plaintext again after it was captured in the
 * wizard. Deliberately stricter than the write side (../route.ts): only the
 * order's assigned technician or the company owner may reveal it, even
 * though other company members can normally read/edit this same row (RLS
 * scopes by company, not by assignment).
 *
 * device_unlock_secret_encrypted is column-level revoked from
 * `authenticated` as of 0030_device_secret_column_lockdown.sql — a direct
 * `.select("device_unlock_secret_encrypted")` here would just come back
 * null/omitted, the same as it would for any other client query. The
 * ciphertext is only reachable through fn_get_device_secret_ciphertext(), a
 * SECURITY DEFINER function that reimplements the assigned_to/owner check
 * independently (it has to — it's the real authorization boundary now,
 * callable directly via PostgREST's /rpc/, not just through this route).
 *
 * This route still does its own pre-check on assigned_to (a column that
 * isn't revoked) before calling the RPC — purely for a friendlier
 * 403/404/410 response than parsing a raised Postgres exception would give,
 * not because the RPC depends on it.
 *
 * Branches per table (rather than a shared dynamic column name) so each
 * `.select()` stays a plain literal string matching that table's real
 * schema — service_orders has delivered_at, quotes has converted_at, never
 * both.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const orderType = body?.orderType as OrderType | undefined
  const orderId = typeof body?.orderId === "string" ? body.orderId : ""

  if ((orderType !== "service_order" && orderType !== "quote") || !orderId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 403 })
  }

  let assignedTo: string | null
  let hasSecret: boolean
  let terminalAt: string | null

  if (orderType === "service_order") {
    const { data: row, error } = await supabase
      .from("service_orders")
      .select("assigned_to, has_device_unlock_secret, delivered_at")
      .eq("id", orderId)
      .maybeSingle()
    if (error || !row) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 })
    }
    assignedTo = row.assigned_to
    hasSecret = row.has_device_unlock_secret
    terminalAt = row.delivered_at
  } else {
    const { data: row, error } = await supabase
      .from("quotes")
      .select("assigned_to, has_device_unlock_secret, converted_at")
      .eq("id", orderId)
      .maybeSingle()
    if (error || !row) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 })
    }
    assignedTo = row.assigned_to
    hasSecret = row.has_device_unlock_secret
    terminalAt = row.converted_at
  }

  const isAuthorized = profile.role === "owner" || assignedTo === user.id
  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Só o técnico atribuído ou o dono da assistência podem revelar esse dado" },
      { status: 403 }
    )
  }

  if (!hasSecret) {
    return NextResponse.json({ error: "Nenhum dado de bloqueio salvo (ou já expirado)" }, { status: 404 })
  }

  if (terminalAt && Date.now() - new Date(terminalAt).getTime() > RETENTION_MS) {
    return NextResponse.json(
      { error: "Esse dado já passou do prazo de retenção e não pode mais ser revelado" },
      { status: 410 }
    )
  }

  const { data: ciphertext, error: rpcError } = await supabase.rpc("fn_get_device_secret_ciphertext", {
    record_id: orderId,
    record_type: orderType,
  })
  if (rpcError || !ciphertext) {
    console.error("[device-secret/reveal] fn_get_device_secret_ciphertext falhou:", rpcError)
    return NextResponse.json({ error: "Nenhum dado de bloqueio salvo (ou já expirado)" }, { status: 404 })
  }

  try {
    const value = decryptDeviceSecret(ciphertext)
    return NextResponse.json({ value })
  } catch (error) {
    console.error("[device-secret/reveal] Falha ao decifrar:", error)
    return NextResponse.json({ error: "Não foi possível decifrar o valor" }, { status: 500 })
  }
}
