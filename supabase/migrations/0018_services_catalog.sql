-- Reusable service price list — picked from Nova OS / Orçamento / PDV item
-- flows instead of typing a free-text line item each time. Mirrors
-- inventory_items (0010), which already backs a picker the same way; unlike
-- inventory, there's no quantity/stock concept here, just a catalog of
-- billable services with a default price the item picker can pre-fill and
-- the user can still override per line item.
create table services_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text,
  default_price_cents bigint not null default 0,
  estimated_duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_catalog_company_id on services_catalog (company_id);

create trigger trg_services_catalog_updated_at
  before update on services_catalog
  for each row execute function fn_set_updated_at();

-- Self-contained RLS (not folded into 0014_rls_policies.sql's tenant_tables
-- loop — that migration runs before this table exists, in migration order).
alter table services_catalog enable row level security;

create policy "services_catalog_select_own_company" on services_catalog
  for select using (company_id = fn_current_company_id());

create policy "services_catalog_insert_own_company" on services_catalog
  for insert with check (company_id = fn_current_company_id());

create policy "services_catalog_update_own_company" on services_catalog
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "services_catalog_delete_own_company" on services_catalog
  for delete using (company_id = fn_current_company_id());
