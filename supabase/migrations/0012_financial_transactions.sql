-- Rows are created by an explicit app-level "register payment" action, not
-- an automatic trigger firing when an OS/sale completes — avoids
-- double-entry bugs if a total is edited after the fact.
create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null, -- e.g. service_order, sale, rent, supplies, salary, other
  amount_cents bigint not null check (amount_cents > 0),
  payment_method text check (payment_method in ('cash', 'pix', 'debit', 'credit', 'bank_transfer', 'other')),
  reference_type text check (reference_type in ('service_order', 'sale', 'manual')),
  reference_id uuid,
  description text,
  occurred_on date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financial_transactions_company_date on financial_transactions (company_id, occurred_on desc);

create trigger trg_financial_transactions_updated_at
  before update on financial_transactions
  for each row execute function fn_set_updated_at();
