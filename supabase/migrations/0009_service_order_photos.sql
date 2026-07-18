create table service_order_photos (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  storage_path text not null,
  stage text not null check (stage in ('entry', 'diagnosis', 'repair', 'delivery')),
  caption text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_service_order_photos_os on service_order_photos (service_order_id);
