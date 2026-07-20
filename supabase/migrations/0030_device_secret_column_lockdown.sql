-- Column-level lockdown for device_unlock_secret_encrypted. RLS (0014,
-- 0029) is row-level only — it already scopes which ROWS `authenticated`
-- can see, but a plain `select("*")` on an allowed row still returns every
-- column, including this one. The ciphertext is harmless without
-- DEVICE_SECRET_ENCRYPTION_KEY (which never leaves the server), but there's
-- no reason for it to reach the browser at all when only
-- /api/device-secret/reveal ever needs it. This migration makes the column
-- itself unreadable by `authenticated`, with a SECURITY DEFINER function as
-- the one sanctioned way back in.

-- ============================================================================
-- A safe, non-sensitive derived flag so the UI can still tell "does this
-- order have a secret saved" without ever selecting the ciphertext —
-- otherwise DeviceSecretCard's rendering guard (today:
-- `serviceOrder.device_unlock_secret_encrypted && ...`) would always be
-- false once the column below is locked down, hiding the card even when a
-- secret exists.
-- ============================================================================
alter table service_orders
  add column has_device_unlock_secret boolean
    generated always as (device_unlock_secret_encrypted is not null) stored;

alter table quotes
  add column has_device_unlock_secret boolean
    generated always as (device_unlock_secret_encrypted is not null) stored;

-- ============================================================================
-- Column-level REVOKE. Postgres note: revoking only a column-level
-- privilege has no effect if a table-level grant already covers every
-- column — the table-level grant takes precedence, so a bare
-- `revoke select (col) on t from authenticated` here would silently do
-- nothing against Supabase's default `grant select on t to authenticated`.
-- The actual fix is to revoke the blanket table-level SELECT and re-grant
-- it column-by-column, omitting device_unlock_secret_encrypted. Tradeoff:
-- any column added to either table from now on needs adding to the GRANT
-- list below too, or it silently stops being selectable by `authenticated`
-- — the same maintenance cost every allowlist has, traded for a
-- deny-by-default posture on new columns instead of the opposite.
-- ============================================================================
revoke select on service_orders from authenticated;
grant select (
  id, company_id, os_number, client_id, client_device_id, status, checklist,
  reported_issue, technician_diagnosis, received_by, assigned_to, warranty_days,
  warranty_notes, subtotal_cents, discount_cents, total_cents, signature_data_url,
  signed_at, delivered_at, has_device_unlock_secret, created_by, created_at, updated_at
) on service_orders to authenticated;

revoke select on quotes from authenticated;
grant select (
  id, company_id, quote_number, client_id, client_device_id, status, device_description,
  reported_issue, technician_diagnosis, checklist, notes, subtotal_cents, discount_cents,
  total_cents, received_by, assigned_to, service_order_id, converted_at,
  has_device_unlock_secret, created_by, created_at, updated_at
) on quotes to authenticated;

-- ============================================================================
-- The one sanctioned way to read the ciphertext back out. SECURITY DEFINER
-- runs with the function owner's privileges (the migration role, not
-- subject to the REVOKE above), so it can select the column regardless of
-- the caller's own grants — which is exactly why the authorization check
-- has to live INSIDE the function, not only in whatever HTTP route happens
-- to call it. Any authenticated user with EXECUTE on this function could
-- call it directly through PostgREST's /rpc/ endpoint, bypassing
-- /api/device-secret/reveal entirely — this function is the real
-- boundary; the route is a convenience wrapper (plus the retention-window
-- re-check) around it, not the enforcement point.
-- ============================================================================
create or replace function fn_get_device_secret_ciphertext(record_id uuid, record_type text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_assigned_to uuid;
  v_company_id uuid;
  v_ciphertext text;
begin
  if record_type = 'service_order' then
    select assigned_to, company_id, device_unlock_secret_encrypted
      into v_assigned_to, v_company_id, v_ciphertext
      from service_orders where id = record_id;
  elsif record_type = 'quote' then
    select assigned_to, company_id, device_unlock_secret_encrypted
      into v_assigned_to, v_company_id, v_ciphertext
      from quotes where id = record_id;
  else
    raise exception 'record_type inválido: %', record_type using errcode = 'P0001';
  end if;

  if v_company_id is null or v_company_id <> fn_current_company_id() then
    -- Same error for "doesn't exist" and "exists in another company" — this
    -- function shouldn't be usable to probe which order IDs exist.
    raise exception 'Registro não encontrado' using errcode = 'P0002';
  end if;

  if not (fn_is_owner() or v_assigned_to = auth.uid()) then
    raise exception 'Só o técnico atribuído ou o dono da assistência podem revelar esse dado' using errcode = 'P0001';
  end if;

  return v_ciphertext;
end;
$$;

grant execute on function fn_get_device_secret_ciphertext(uuid, text) to authenticated;

-- ============================================================================
-- useConvertQuoteToServiceOrder copies a quote's ciphertext into the
-- service_orders row it converts into — that mutation runs as
-- `authenticated`, so once quotes.device_unlock_secret_encrypted is
-- column-revoked above, it can no longer read the value client-side to
-- carry it forward. This does the copy server-side instead. No
-- assigned_to/owner restriction here (unlike the function above): copying
-- this field is part of the same conversion step that already copies every
-- other quote field into the new OS, which any company member with
-- permission to convert a quote already performs.
-- ============================================================================
create or replace function fn_copy_quote_device_secret(p_quote_id uuid, p_service_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_quote_company_id uuid;
  v_so_company_id uuid;
  v_ciphertext text;
begin
  select company_id, device_unlock_secret_encrypted into v_quote_company_id, v_ciphertext
    from quotes where id = p_quote_id;
  select company_id into v_so_company_id from service_orders where id = p_service_order_id;

  if v_quote_company_id is null or v_so_company_id is null then
    raise exception 'Registro não encontrado' using errcode = 'P0002';
  end if;
  if v_quote_company_id <> fn_current_company_id() or v_so_company_id <> fn_current_company_id() then
    raise exception 'Sem permissão' using errcode = 'P0001';
  end if;

  update service_orders set device_unlock_secret_encrypted = v_ciphertext where id = p_service_order_id;
end;
$$;

grant execute on function fn_copy_quote_device_secret(uuid, uuid) to authenticated;
