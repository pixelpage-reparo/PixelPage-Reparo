-- The tenant. Every other table (directly or indirectly) scopes to a company_id.
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#2563eb',
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  daily_goal_cents bigint not null default 0,
  plan text not null default 'trial' check (plan in ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function fn_set_updated_at();

-- Per-company counter backing the sequential, human-facing OS number
-- (see fn_next_os_number in 0006_service_orders.sql).
create table company_sequences (
  company_id uuid primary key references companies(id) on delete cascade,
  next_os_number integer not null default 1
);

create or replace function fn_seed_company_sequence()
returns trigger
language plpgsql
as $$
begin
  insert into company_sequences (company_id) values (new.id);
  return new;
end;
$$;

create trigger trg_companies_seed_sequence
  after insert on companies
  for each row execute function fn_seed_company_sequence();
