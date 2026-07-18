create table resale_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  brand text not null,
  model text not null,
  storage_capacity text,
  color text,
  imei text,
  condition text not null check (condition in ('new', 'sealed', 'used_excellent', 'used_good', 'used_fair')),
  cost_cents bigint not null default 0,
  price_cents bigint not null,
  description text,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resale_devices_company_id on resale_devices (company_id);
create index idx_resale_devices_public on resale_devices (company_id) where is_public = true;

create trigger trg_resale_devices_updated_at
  before update on resale_devices
  for each row execute function fn_set_updated_at();

create table resale_device_photos (
  id uuid primary key default gen_random_uuid(),
  resale_device_id uuid not null references resale_devices(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_resale_device_photos_device on resale_device_photos (resale_device_id, position);

create table showcase_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references companies(id) on delete cascade,
  is_enabled boolean not null default false,
  whatsapp_number text,
  headline text,
  show_prices boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_showcase_settings_updated_at
  before update on showcase_settings
  for each row execute function fn_set_updated_at();
