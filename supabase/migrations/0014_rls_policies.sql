-- ============================================================================
-- Assumption: every SECURITY DEFINER function in this schema (here and in
-- 0006, 0007, 0015, 0016) is created by the migration role (`postgres` /
-- `supabase_admin` on Supabase), which has BYPASSRLS. That's what lets
-- fn_adjust_inventory_stock, fn_create_company_and_owner, the status-history
-- logger, etc. write across the tables they touch regardless of the
-- policies below — the policies still fully constrain any direct
-- client-side query through PostgREST/supabase-js.
-- ============================================================================

-- ============================================================================
-- Helper functions
-- ============================================================================

-- The hard tenant-isolation boundary: every policy below scopes to this.
create or replace function fn_current_company_id()
returns uuid
language sql
stable security definer set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function fn_is_owner()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false)
$$;

-- Module-level visibility is enforced at the app/route layer (sidebar +
-- ModuleGate) for most modules — over-restricting at the RLS layer would
-- break legitimate cross-module reads (e.g. billing a part into an OS
-- requires reading inventory_items even if that employee's Inventory nav
-- page is locked). financial_transactions is the one exception: the brief
-- frames finance as a trust/privacy boundary, not just navigation, so it
-- gets this extra check below. Owners always pass.
create or replace function fn_has_module_access(p_module_key text)
returns boolean
language plpgsql
stable security definer set search_path = public
as $$
declare
  v_can_view boolean;
begin
  if fn_is_owner() then
    return true;
  end if;

  select can_view into v_can_view
    from module_permissions
    where profile_id = auth.uid() and module_key = p_module_key;

  return coalesce(v_can_view, false);
end;
$$;

-- ============================================================================
-- companies — id IS the tenant id, so it scopes to itself, not a company_id column.
-- ============================================================================
alter table companies enable row level security;

create policy "companies_select_own" on companies
  for select using (id = fn_current_company_id());

-- RLS is a row-level mechanism — it can gate WHICH row an owner may touch,
-- but not WHICH COLUMNS within that row. This policy is deliberately named
-- "branding": it's the row-level half of the split. The other half —
-- blocking plan/stripe_customer_id/stripe_subscription_id regardless of
-- which row is targeted — is enforced below via column-level REVOKE, since
-- that's the only mechanism Postgres actually offers for per-column access.
create policy "companies_update_branding_owner_only" on companies
  for update using (id = fn_current_company_id() and fn_is_owner())
  with check (id = fn_current_company_id() and fn_is_owner());

-- No insert/delete policy: companies are only created via the
-- fn_create_company_and_owner() SECURITY DEFINER RPC (0016).

-- SECURITY: billing fields are column-locked away from `authenticated`
-- entirely — even an owner who passes the row-level policy above cannot
-- PATCH these three columns from the client. The only writer is
-- fn_update_company_billing() below, executed as SECURITY DEFINER and
-- granted only to `service_role` (i.e. the future Stripe webhook, never a
-- browser session). This is enforced independently of RLS: Postgres checks
-- column-level privileges before policies are even evaluated, so this
-- holds even if a future policy change accidentally widens row access.
revoke update (plan, stripe_customer_id, stripe_subscription_id) on companies from authenticated;

create or replace function fn_update_company_billing(
  p_company_id uuid,
  p_plan text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update companies
    set plan = p_plan,
        stripe_customer_id = p_stripe_customer_id,
        stripe_subscription_id = p_stripe_subscription_id
    where id = p_company_id;
end;
$$;

-- Not granted to `authenticated` or `anon` — only the service-role webhook
-- (Stripe integration, not built yet) is meant to ever call this.
revoke all on function fn_update_company_billing(uuid, text, text, text) from public;
grant execute on function fn_update_company_billing(uuid, text, text, text) to service_role;

-- ============================================================================
-- company_sequences — internal counter, never written by client code
-- directly (only via fn_next_os_number / fn_seed_company_sequence, both
-- SECURITY DEFINER). Select-only policy; no insert/update/delete policy
-- means direct client writes are denied by default.
-- ============================================================================
alter table company_sequences enable row level security;

create policy "company_sequences_select_own_company" on company_sequences
  for select using (company_id = fn_current_company_id());

-- ============================================================================
-- profiles
-- ============================================================================
alter table profiles enable row level security;

create policy "profiles_select_own_company" on profiles
  for select using (company_id = fn_current_company_id());

create policy "profiles_update_self_or_owner" on profiles
  for update using (id = auth.uid() or (company_id = fn_current_company_id() and fn_is_owner()))
  with check (company_id = fn_current_company_id());

-- RLS alone can't stop the self-update branch above from also flipping
-- role/is_active/company_id (USING sees the old row, WITH CHECK only sees
-- the new one — there's no column-level old-vs-new comparison in a
-- declarative policy). Without this guard, an employee could UPDATE their
-- own row to role='owner'. Only an owner may change these fields.
create or replace function fn_profiles_guard_privileged_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not fn_is_owner() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.company_id is distinct from old.company_id then
      raise exception 'Apenas o dono pode alterar papel, status ou empresa do perfil' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_guard_privileged_fields
  before update on profiles
  for each row execute function fn_profiles_guard_privileged_fields();

create policy "profiles_delete_owner_only" on profiles
  for delete using (company_id = fn_current_company_id() and fn_is_owner());

-- No insert policy: the first (owner) profile is created by
-- fn_create_company_and_owner() (0016); inviting employees needs a
-- service-role Edge Function, out of scope while there's no live project.

-- ============================================================================
-- module_permissions — owner-managed only
-- ============================================================================
alter table module_permissions enable row level security;

create policy "module_permissions_select_own_company" on module_permissions
  for select using (company_id = fn_current_company_id());

create policy "module_permissions_insert_owner_only" on module_permissions
  for insert with check (company_id = fn_current_company_id() and fn_is_owner());

create policy "module_permissions_update_owner_only" on module_permissions
  for update using (company_id = fn_current_company_id() and fn_is_owner())
  with check (company_id = fn_current_company_id() and fn_is_owner());

create policy "module_permissions_delete_owner_only" on module_permissions
  for delete using (company_id = fn_current_company_id() and fn_is_owner());

-- ============================================================================
-- Standard 4-policy pattern for the remaining tenant tables: every row
-- belongs to the caller's own company, full stop.
--
-- service_orders, sales, inventory_movements and service_order_photos are
-- deliberately NOT in this list — they have "who did this" attribution
-- columns (created_by/assigned_to, sold_by, created_by, created_by) that
-- this generic pattern can't validate, so they get their own explicit
-- policy blocks below instead, with those columns checked in the WITH CHECK.
-- ============================================================================
do $$
declare
  t text;
  tenant_tables text[] := array[
    'clients',
    'client_devices',
    'service_order_items',
    'inventory_items',
    'sale_items',
    'resale_devices',
    'resale_device_photos',
    'showcase_settings'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security', t);

    execute format(
      'create policy "%s_select_own_company" on %I for select using (company_id = fn_current_company_id())',
      t, t
    );
    execute format(
      'create policy "%s_insert_own_company" on %I for insert with check (company_id = fn_current_company_id())',
      t, t
    );
    execute format(
      'create policy "%s_update_own_company" on %I for update using (company_id = fn_current_company_id()) with check (company_id = fn_current_company_id())',
      t, t
    );
    execute format(
      'create policy "%s_delete_own_company" on %I for delete using (company_id = fn_current_company_id())',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================================
-- service_order_photos — standard company scoping, plus: created_by, if
-- set, must be the caller. Only checked on INSERT — same reasoning as
-- service_orders.created_by below (set once by whoever uploads the photo,
-- not revised if a different teammate edits the caption later).
-- ============================================================================
alter table service_order_photos enable row level security;

create policy "service_order_photos_select_own_company" on service_order_photos
  for select using (company_id = fn_current_company_id());

create policy "service_order_photos_insert_own_company" on service_order_photos
  for insert with check (
    company_id = fn_current_company_id()
    and (created_by is null or created_by = auth.uid())
  );

create policy "service_order_photos_update_own_company" on service_order_photos
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "service_order_photos_delete_own_company" on service_order_photos
  for delete using (company_id = fn_current_company_id());

-- ============================================================================
-- service_orders — standard company scoping, plus:
--   * created_by, if set, must be the caller (auth.uid()) — stops one
--     employee from creating an OS attributed to someone else.
--   * assigned_to ("Executor") and received_by ("Recebido Por"), if set,
--     must each be a profile in the same company.
-- created_by is only checked by RLS on INSERT, not UPDATE (see the note
-- above these policies), but the guard trigger further down makes it
-- immutable outright — no UPDATE, by anyone, may change it at all, whether
-- or not this policy's WITH CHECK would otherwise allow the row through.
-- assigned_to/received_by are checked on both INSERT and UPDATE since
-- reassigning either to a different teammate is a normal, ongoing action.
-- ============================================================================
alter table service_orders enable row level security;

create policy "service_orders_select_own_company" on service_orders
  for select using (company_id = fn_current_company_id());

create policy "service_orders_insert_own_company" on service_orders
  for insert with check (
    company_id = fn_current_company_id()
    and (created_by is null or created_by = auth.uid())
    and (
      assigned_to is null
      or exists (
        select 1 from profiles p where p.id = assigned_to and p.company_id = fn_current_company_id()
      )
    )
    and (
      received_by is null
      or exists (
        select 1 from profiles p where p.id = received_by and p.company_id = fn_current_company_id()
      )
    )
  );

create policy "service_orders_update_own_company" on service_orders
  for update using (company_id = fn_current_company_id())
  with check (
    company_id = fn_current_company_id()
    and (
      assigned_to is null
      or exists (
        select 1 from profiles p where p.id = assigned_to and p.company_id = fn_current_company_id()
      )
    )
    and (
      received_by is null
      or exists (
        select 1 from profiles p where p.id = received_by and p.company_id = fn_current_company_id()
      )
    )
  );

create policy "service_orders_delete_own_company" on service_orders
  for delete using (company_id = fn_current_company_id());

-- created_by is immutable, full stop — enforced here rather than in RLS
-- because a WITH CHECK only ever sees the resulting row, not "did this
-- particular column change", so it can't express "leave it alone" vs
-- "don't set it to something new" as two different rules. A no-op update
-- (new value equal to old, including both null) is allowed; any other
-- change is rejected outright, regardless of who's making it — even the
-- owner can't reassign authorship of an existing OS.
create or replace function fn_service_orders_guard_created_by()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by não pode ser alterado após a criação da OS' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_service_orders_guard_created_by
  before update on service_orders
  for each row execute function fn_service_orders_guard_created_by();

-- ============================================================================
-- sales — standard company scoping, plus: sold_by, if set, must be the
-- caller. Only checked by RLS on INSERT (same reasoning as
-- service_orders.created_by above), and made fully immutable by the guard
-- trigger below, same pattern as service_orders.created_by.
-- ============================================================================
alter table sales enable row level security;

create policy "sales_select_own_company" on sales
  for select using (company_id = fn_current_company_id());

create policy "sales_insert_own_company" on sales
  for insert with check (
    company_id = fn_current_company_id()
    and (sold_by is null or sold_by = auth.uid())
  );

create policy "sales_update_own_company" on sales
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "sales_delete_own_company" on sales
  for delete using (company_id = fn_current_company_id());

-- sold_by is immutable, full stop — same reasoning and no-op-allowed
-- semantics as fn_service_orders_guard_created_by() above.
create or replace function fn_sales_guard_sold_by()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.sold_by is distinct from old.sold_by then
    raise exception 'sold_by não pode ser alterado após o registro da venda' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_sales_guard_sold_by
  before update on sales
  for each row execute function fn_sales_guard_sold_by();

-- ============================================================================
-- inventory_movements — append-only ledger. No update/delete policy at
-- all: every legitimate write already goes through
-- fn_adjust_inventory_stock (SECURITY DEFINER, bypasses RLS entirely), so
-- there is no legitimate client-side path that needs to modify or remove
-- an existing movement row. Select + insert only; insert requires
-- created_by (if set) to be the caller.
-- ============================================================================
alter table inventory_movements enable row level security;

create policy "inventory_movements_select_own_company" on inventory_movements
  for select using (company_id = fn_current_company_id());

create policy "inventory_movements_insert_own_company" on inventory_movements
  for insert with check (
    company_id = fn_current_company_id()
    and (created_by is null or created_by = auth.uid())
  );

-- ============================================================================
-- service_order_status_history — read by company, insert only via the
-- SECURITY DEFINER trigger (0007) in normal operation. No update/delete:
-- it's an immutable log.
-- ============================================================================
alter table service_order_status_history enable row level security;

create policy "service_order_status_history_select_own_company" on service_order_status_history
  for select using (company_id = fn_current_company_id());

create policy "service_order_status_history_insert_own_company" on service_order_status_history
  for insert with check (
    company_id = fn_current_company_id()
    and (changed_by is null or changed_by = auth.uid())
    and exists (
      select 1 from service_orders so
      where so.id = service_order_id and so.company_id = fn_current_company_id()
    )
  );

-- ============================================================================
-- financial_transactions — extra module-access check on top of tenant scoping.
-- ============================================================================
alter table financial_transactions enable row level security;

create policy "financial_transactions_select" on financial_transactions
  for select using (company_id = fn_current_company_id() and fn_has_module_access('finance'));

create policy "financial_transactions_insert" on financial_transactions
  for insert with check (company_id = fn_current_company_id() and fn_has_module_access('finance'));

create policy "financial_transactions_update" on financial_transactions
  for update using (company_id = fn_current_company_id() and fn_has_module_access('finance'))
  with check (company_id = fn_current_company_id() and fn_has_module_access('finance'));

create policy "financial_transactions_delete" on financial_transactions
  for delete using (company_id = fn_current_company_id() and fn_has_module_access('finance'));

-- ============================================================================
-- Public showcase — anonymous, unauthenticated read access for the public
-- vitrine route. These stack on top of the standard company-scoped
-- policies created above (Postgres OR's together permissive policies).
-- ============================================================================
-- `to public` (not `to anon`) so the policy also covers an authenticated
-- user browsing another company's public vitrine, not just signed-out visitors.
create policy "resale_devices_select_public" on resale_devices
  for select to public
  using (is_public = true);

create policy "resale_device_photos_select_public" on resale_device_photos
  for select to public
  using (
    exists (
      select 1 from resale_devices rd
      where rd.id = resale_device_photos.resale_device_id and rd.is_public = true
    )
  );

create policy "showcase_settings_select_public" on showcase_settings
  for select to public
  using (is_enabled = true);

-- The public vitrine page resolves a company by slug before it can show
-- anything — without this, "companies_select_own" (owner-only) leaves
-- anon with zero visibility into even the id/name/logo needed to render
-- the page. Scoped tightly: only companies that opted into showcase_settings
-- become visible this way, and only by slug lookup (not enumerable listing).
create policy "companies_select_public_showcase" on companies
  for select to public
  using (
    exists (
      select 1 from showcase_settings ss
      where ss.company_id = companies.id and ss.is_enabled = true
    )
  );
