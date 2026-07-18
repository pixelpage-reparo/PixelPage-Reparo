-- Immutable audit log of every status change. No updated_at — rows are
-- never edited after insert.
create table service_order_status_history (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  status service_order_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_service_order_status_history_os on service_order_status_history (service_order_id, created_at desc);

create or replace function fn_log_service_order_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into service_order_status_history (service_order_id, company_id, status, changed_by)
    values (new.id, new.company_id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_service_orders_log_status
  after insert or update of status on service_orders
  for each row execute function fn_log_service_order_status();
