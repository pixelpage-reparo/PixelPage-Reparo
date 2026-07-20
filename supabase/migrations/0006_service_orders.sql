-- Atomically hands out the next per-company OS number. The UPDATE's row
-- lock on company_sequences is what makes concurrent OS creation safe.
create or replace function fn_next_os_number(p_company_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_number integer;
begin
  update company_sequences
    set next_os_number = next_os_number + 1
    where company_id = p_company_id
    returning next_os_number - 1 into v_number;

  if not found then
    raise exception 'Empresa % não encontrada', p_company_id using errcode = 'P0001';
  end if;

  return v_number;
end;
$$;

create table service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  os_number integer not null,
  client_id uuid references clients(id),
  client_device_id uuid references client_devices(id),
  status service_order_status not null default 'received',
  checklist jsonb not null default '{}'::jsonb, -- screen/camera/audio/connectivity booleans + notes
  reported_issue text,
  technician_diagnosis text,
  -- "Recebido Por" (intake) vs "Executor" (repair) — two distinct per-OS
  -- role tags from the Nova OS wizard's step 5, both optional and both
  -- validated same-company by the existing service_orders RLS policies.
  received_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  warranty_days integer not null default 90,
  warranty_notes text,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  total_cents bigint not null default 0,
  signature_data_url text,
  signed_at timestamptz,
  delivered_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, os_number)
);

create index idx_service_orders_company_status on service_orders (company_id, status);
create index idx_service_orders_company_client on service_orders (company_id, client_id);
create index idx_service_orders_company_created_at on service_orders (company_id, created_at desc);

create trigger trg_service_orders_updated_at
  before update on service_orders
  for each row execute function fn_set_updated_at();

create or replace function fn_service_orders_set_number()
returns trigger
language plpgsql
as $$
begin
  if new.os_number is null then
    new.os_number := fn_next_os_number(new.company_id);
  end if;
  return new;
end;
$$;

create trigger trg_service_orders_set_number
  before insert on service_orders
  for each row execute function fn_service_orders_set_number();
