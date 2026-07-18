-- inventory_item_id intentionally has no FK constraint yet — inventory_items
-- is created in 0010_inventory.sql, which adds the constraint at the end.
-- This is the table fn_service_order_items_inventory_sync() (0015) watches.
create table service_order_items (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null check (kind in ('service', 'part')),
  inventory_item_id uuid, -- null for pure services
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  total_cents bigint generated always as (quantity * unit_price_cents) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_service_order_items_os on service_order_items (service_order_id);
create index idx_service_order_items_inventory_item on service_order_items (inventory_item_id);

create trigger trg_service_order_items_updated_at
  before update on service_order_items
  for each row execute function fn_set_updated_at();
