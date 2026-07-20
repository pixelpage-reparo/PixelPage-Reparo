-- Despesas Fixas — "cadastre uma vez e deixe o sistema cobrar sozinho"
-- (Financeiro's 5th tab). Generation itself (turning a due rule into a real
-- financial_transactions row) is a scheduled job — Supabase pg_cron or a
-- Vercel Cron hitting a Route Handler — not implemented in this pass; this
-- migration only lands the schema + the app CRUD for configuring rules.
create table recurring_expense_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  category text not null default 'Despesa fixa',
  frequency text not null default 'monthly' check (frequency in ('monthly', 'weekly')),
  day_of_month integer check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  last_generated_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_expense_rules_company_id on recurring_expense_rules (company_id);

create trigger trg_recurring_expense_rules_updated_at
  before update on recurring_expense_rules
  for each row execute function fn_set_updated_at();

alter table recurring_expense_rules enable row level security;

create policy "recurring_expense_rules_select_own_company" on recurring_expense_rules
  for select using (company_id = fn_current_company_id());

create policy "recurring_expense_rules_insert_own_company" on recurring_expense_rules
  for insert with check (company_id = fn_current_company_id());

create policy "recurring_expense_rules_update_own_company" on recurring_expense_rules
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "recurring_expense_rules_delete_own_company" on recurring_expense_rules
  for delete using (company_id = fn_current_company_id());
