create table sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id), -- optional: POS sale linked to an OS
  client_id uuid references clients(id), -- optional: walk-in sale has no client
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  payment_method text check (payment_method in ('cash', 'pix', 'debit', 'credit', 'bank_transfer', 'other')),
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  total_cents bigint not null default 0,
  sold_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sales_company_created_at on sales (company_id, created_at desc);
create index idx_sales_client_id on sales (client_id);

create trigger trg_sales_updated_at
  before update on sales
  for each row execute function fn_set_updated_at();

-- Same shape as service_order_items — watched by the mirrored
-- fn_sale_items_inventory_sync() trigger (0015).
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id),
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  total_cents bigint generated always as (quantity * unit_price_cents) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sale_items_sale_id on sale_items (sale_id);
create index idx_sale_items_inventory_item on sale_items (inventory_item_id);

create trigger trg_sale_items_updated_at
  before update on sale_items
  for each row execute function fn_set_updated_at();

-- clients.total_spent as a computed view (not a materialized column) —
-- avoids a second consistency-critical trigger system alongside the
-- inventory ledger. Can become a trigger-maintained column later without
-- changing callers (same shape). Lives here because it needs both
-- service_orders and sales to already exist.
create view v_client_totals as
select
  c.id as client_id,
  c.company_id,
  coalesce(os_totals.total_cents, 0) + coalesce(sale_totals.total_cents, 0) as total_spent_cents,
  greatest(os_totals.last_at, sale_totals.last_at) as last_service_at
from clients c
left join (
  select client_id, sum(total_cents) as total_cents, max(delivered_at) as last_at
  from service_orders
  where status = 'delivered' and client_id is not null
  group by client_id
) os_totals on os_totals.client_id = c.id
left join (
  select client_id, sum(total_cents) as total_cents, max(created_at) as last_at
  from sales
  where status = 'completed' and client_id is not null
  group by client_id
) sale_totals on sale_totals.client_id = c.id;

-- SECURITY: without this, the view runs with the privileges of its owner
-- (the migration role, which has BYPASSRLS on Supabase) instead of the
-- querying role — meaning the RLS policies on clients/service_orders/sales
-- would be silently skipped and any authenticated user could read another
-- company's client totals by guessing/passing a foreign client_id.
-- security_invoker (Postgres 15+) makes the view evaluate as the caller,
-- so those tables' own RLS policies apply normally again.
alter view v_client_totals set (security_invoker = true);
