import { createClient as createServiceRoleClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import type { ProfileJobTitle } from "@/types/domain"

/**
 * Invites a new employee — the first mutation in the app besides the
 * Stripe webhook that needs the service-role key, since client-side
 * supabase-js can't create auth.users rows directly. The service role
 * bypasses RLS entirely, so this route manually re-checks that the caller
 * is an authenticated owner of a company BEFORE touching the admin API —
 * skipping that check would let any signed-in user invite arbitrary emails
 * into any company.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : ""
  const jobTitle = (body?.jobTitle as ProfileJobTitle | null | undefined) ?? null
  const appAccessEnabled = typeof body?.appAccessEnabled === "boolean" ? body.appAccessEnabled : true
  const bancadaIntake = typeof body?.bancadaIntake === "boolean" ? body.bancadaIntake : false
  const bancadaExecutor = typeof body?.bancadaExecutor === "boolean" ? body.bancadaExecutor : false

  if (!email) {
    return NextResponse.json({ error: "Informe o e-mail do funcionário" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()
  if (profileError || !callerProfile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 403 })
  }
  if (callerProfile.role !== "owner") {
    return NextResponse.json({ error: "Só o dono da assistência pode convidar funcionários" }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[team/invite] SUPABASE_SERVICE_ROLE_KEY não configurada — recusando requisição.")
    return NextResponse.json({ error: "Convite de funcionário não configurado no servidor" }, { status: 500 })
  }

  const admin = createServiceRoleClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || email },
  })
  if (inviteError || !invited.user) {
    return NextResponse.json({ error: inviteError?.message ?? "Não foi possível enviar o convite" }, { status: 400 })
  }

  const { error: insertProfileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    company_id: callerProfile.company_id,
    full_name: fullName || email,
    email,
    role: "employee",
    job_title: jobTitle,
    app_access_enabled: appAccessEnabled,
    bancada_intake: bancadaIntake,
    bancada_executor: bancadaExecutor,
  })
  if (insertProfileError) {
    return NextResponse.json({ error: insertProfileError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
