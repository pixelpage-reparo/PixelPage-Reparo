-- One row per auth.users member, scoped to exactly one company.
-- role='owner' always bypasses module_permissions (see fn_has_module_access).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'employee' check (role in ('owner', 'employee')),
  -- Purely descriptive "cargo" — never grants access on its own. Module
  -- visibility stays 100% controlled by module_permissions regardless of
  -- job_title; see fn_has_module_access(), which never reads this column.
  job_title text check (job_title in ('tecnico', 'recepcionista', 'gerente')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_company_id on profiles (company_id);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function fn_set_updated_at();
