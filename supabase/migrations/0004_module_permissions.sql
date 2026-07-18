-- Binary per-module visibility (MVP). can_edit/can_delete are reserved,
-- unenforced columns — the hook for adding granular permissions later
-- without a breaking schema change.
create table module_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  module_key text not null check (
    module_key in (
      'dashboard', 'service_orders', 'clients', 'inventory',
      'finance', 'team', 'pos', 'showcase'
    )
  ),
  can_view boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, module_key)
);

create index idx_module_permissions_company_id on module_permissions (company_id);

create trigger trg_module_permissions_updated_at
  before update on module_permissions
  for each row execute function fn_set_updated_at();
