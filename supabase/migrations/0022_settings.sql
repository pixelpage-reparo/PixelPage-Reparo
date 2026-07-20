-- Perfil da Loja (Settings) — additive company-level fields plus two new
-- shared tables. message_templates is consumed both here (CRUD) and later
-- by Pós-Venda (Fase 8), which just reads templates scoped to its own
-- template_key values — built once, reused twice, same relationship as the
-- Stepper primitive shared by the Nova OS and Aparelhos wizards.
alter table companies
  add column whatsapp_number text,
  add column address_cep text,
  add column address_street text,
  add column address_number text,
  add column address_complement text,
  add column address_neighborhood text,
  add column address_city text,
  add column address_state text,
  add column language text not null default 'pt-BR' check (language in ('pt-BR', 'es', 'en')),
  add column warranty_terms_text text,
  add column photo_retention_days integer not null default 365;

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  -- e.g. 'os_status_received', 'os_status_ready_for_pickup', 'google_review_request',
  -- 'birthday' — free-form key, validated at the application layer per
  -- consumer (Settings today; Pós-Venda in Fase 8), not a DB CHECK, since
  -- the set of valid keys grows as new trigger points are added.
  template_key text not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email')),
  body text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, template_key)
);

create index idx_message_templates_company_id on message_templates (company_id);

create trigger trg_message_templates_updated_at
  before update on message_templates
  for each row execute function fn_set_updated_at();

create table payment_method_fees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payment_method text not null check (payment_method in ('cash', 'pix', 'debit', 'credit')),
  installments integer not null default 1 check (installments between 1 and 12),
  fee_percent numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, payment_method, installments)
);

create index idx_payment_method_fees_company_id on payment_method_fees (company_id);

create trigger trg_payment_method_fees_updated_at
  before update on payment_method_fees
  for each row execute function fn_set_updated_at();

alter table message_templates enable row level security;

create policy "message_templates_select_own_company" on message_templates
  for select using (company_id = fn_current_company_id());

create policy "message_templates_insert_own_company" on message_templates
  for insert with check (company_id = fn_current_company_id());

create policy "message_templates_update_own_company" on message_templates
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "message_templates_delete_own_company" on message_templates
  for delete using (company_id = fn_current_company_id());

alter table payment_method_fees enable row level security;

create policy "payment_method_fees_select_own_company" on payment_method_fees
  for select using (company_id = fn_current_company_id());

create policy "payment_method_fees_insert_own_company" on payment_method_fees
  for insert with check (company_id = fn_current_company_id());

create policy "payment_method_fees_update_own_company" on payment_method_fees
  for update using (company_id = fn_current_company_id())
  with check (company_id = fn_current_company_id());

create policy "payment_method_fees_delete_own_company" on payment_method_fees
  for delete using (company_id = fn_current_company_id());
