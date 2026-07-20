-- Caixa — open/close till per work shift. Per product decision,
-- reconciliation is cash-only: PIX/card show as reference in the shift
-- report but aren't counted physically, so this only tracks the starting
-- float and the counted cash total at close. "Expected cash" is computed at
-- close time from financial_transactions (payment_method = 'cash',
-- occurred_on within the session's open window) rather than via a
-- register_session_id FK on every cash-producing table — tagging every
-- insert path (POS sale, manual transaction, future modules) would touch
-- much more surface than a time-range aggregation needs to for a first pass.
create table cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  opened_by uuid references profiles(id),
  opened_at timestamptz not null default now(),
  starting_float_cents bigint not null default 0,
  closed_by uuid references profiles(id),
  closed_at timestamptz,
  counted_total_cents bigint,
  expected_total_cents bigint,
  discrepancy_cents bigint,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforces one open session per company at the database level — a second
-- "abrir caixa" while one is already open fails on this constraint, not
-- just on app-level logic that could race.
create unique index idx_cash_register_sessions_one_open
  on cash_register_sessions (company_id)
  where status = 'open';

create index idx_cash_register_sessions_company_id on cash_register_sessions (company_id, opened_at desc);

create trigger trg_cash_register_sessions_updated_at
  before update on cash_register_sessions
  for each row execute function fn_set_updated_at();

alter table cash_register_sessions enable row level security;

create policy "cash_register_sessions_select_own_company" on cash_register_sessions
  for select using (company_id = fn_current_company_id());

create policy "cash_register_sessions_insert_own_company" on cash_register_sessions
  for insert with check (company_id = fn_current_company_id());

create policy "cash_register_sessions_update_own_company" on cash_register_sessions
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "cash_register_sessions_delete_own_company" on cash_register_sessions
  for delete using (company_id = fn_current_company_id());
