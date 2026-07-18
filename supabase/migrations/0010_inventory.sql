create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text,
  sku text,
  unit text not null default 'un',
  quantity integer not null default 0 check (quantity >= 0), -- belt-and-suspenders backstop; the real guard is fn_adjust_inventory_stock (0015)
  min_quantity_alert integer not null default 1,
  cost_cents bigint not null default 0,
  sale_price_cents bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inventory_items_company_id on inventory_items (company_id);
-- Powers the low-stock alert list without scanning the whole table.
create index idx_inventory_items_low_stock on inventory_items (company_id) where quantity <= min_quantity_alert;

create trigger trg_inventory_items_updated_at
  before update on inventory_items
  for each row execute function fn_set_updated_at();

-- Append-only audit ledger. Every quantity change on inventory_items must
-- go through fn_adjust_inventory_stock (0015), which writes both sides.
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('write_off', 'restore', 'manual_adjustment', 'initial_stock')),
  quantity_delta integer not null,
  reference_type text check (reference_type in ('service_order_item', 'sale_item', 'manual')),
  reference_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_item on inventory_movements (inventory_item_id, created_at desc);

-- Deferred from 0008_service_order_items.sql, now that inventory_items exists.
alter table service_order_items
  add constraint service_order_items_inventory_item_id_fkey
  foreign key (inventory_item_id) references inventory_items(id);
