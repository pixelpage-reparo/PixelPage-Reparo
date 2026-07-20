-- Orçamentos (quotes) — a commercial proposal sent to the client before it
-- becomes a real OS. Same shape as service_orders/service_order_items
-- (0006/0008); an approved quote converts into a service_orders row at the
-- application layer (reusing useCreateServiceOrder's exact insert shape),
-- not via a DB function, so both flows stay in one place to maintain.

alter table company_sequences add column next_quote_number integer not null default 1;

-- Mirrors fn_next_os_number (0006) — the UPDATE's row lock on
-- company_sequences is what makes concurrent quote creation safe.
create or replace function fn_next_quote_number(p_company_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_number integer;
begin
  update company_sequences
    set next_quote_number = next_quote_number + 1
    where company_id = p_company_id
    returning next_quote_number - 1 into v_number;

  if not found then
    raise exception 'Empresa % não encontrada', p_company_id using errcode = 'P0001';
  end if;

  return v_number;
end;
$$;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  quote_number integer not null,
  client_id uuid references clients(id),
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'aprovado', 'recusado', 'convertido')),
  device_description text,
  notes text,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  total_cents bigint not null default 0,
  -- Set once, when a quote is converted — links forward to the OS it
  -- became. Never the reverse FK (service_orders has no quote_id) since a
  -- quote is optional/upstream of an OS, not every OS has one.
  service_order_id uuid references service_orders(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quote_number)
);

create index idx_quotes_company_status on quotes (company_id, status);
create index idx_quotes_company_created_at on quotes (company_id, created_at desc);

create trigger trg_quotes_updated_at
  before update on quotes
  for each row execute function fn_set_updated_at();

create or replace function fn_quotes_set_number()
returns trigger
language plpgsql
as $$
begin
  if new.quote_number is null then
    new.quote_number := fn_next_quote_number(new.company_id);
  end if;
  return new;
end;
$$;

create trigger trg_quotes_set_number
  before insert on quotes
  for each row execute function fn_quotes_set_number();

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null check (kind in ('service', 'part')),
  inventory_item_id uuid references inventory_items(id),
  services_catalog_id uuid references services_catalog(id),
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  total_cents bigint generated always as (quantity * unit_price_cents) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quote_items_quote_id on quote_items (quote_id);

create trigger trg_quote_items_updated_at
  before update on quote_items
  for each row execute function fn_set_updated_at();

-- Self-contained RLS, same pattern as services_catalog (0018) — both run
-- after 0014_rls_policies.sql's tenant_tables loop, so they can't be folded
-- into it.
alter table quotes enable row level security;

create policy "quotes_select_own_company" on quotes
  for select using (company_id = fn_current_company_id());

create policy "quotes_insert_own_company" on quotes
  for insert with check (
    company_id = fn_current_company_id()
    and (created_by is null or created_by = auth.uid())
  );

create policy "quotes_update_own_company" on quotes
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "quotes_delete_own_company" on quotes
  for delete using (company_id = fn_current_company_id());

alter table quote_items enable row level security;

create policy "quote_items_select_own_company" on quote_items
  for select using (company_id = fn_current_company_id());

create policy "quote_items_insert_own_company" on quote_items
  for insert with check (company_id = fn_current_company_id());

create policy "quote_items_update_own_company" on quote_items
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "quote_items_delete_own_company" on quote_items
  for delete using (company_id = fn_current_company_id());
