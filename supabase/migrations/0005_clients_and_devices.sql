create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  document text, -- CPF/CNPJ, LGPD-sensitive
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_company_phone on clients (company_id, phone);
-- Trigram index powers the "quick search by name" requirement.
create index idx_clients_full_name_trgm on clients using gin (full_name gin_trgm_ops);

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function fn_set_updated_at();

create table client_devices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  brand text,
  model text,
  color text,
  serial_or_imei text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_client_devices_client_id on client_devices (client_id);

create trigger trg_client_devices_updated_at
  before update on client_devices
  for each row execute function fn_set_updated_at();

-- v_client_totals (clients.total_spent as a computed view) is created in
-- 0011_sales.sql, once both service_orders and sales exist.
