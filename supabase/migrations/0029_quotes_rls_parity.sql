-- Closes two RLS gaps between quotes and its service_orders equivalent.
-- Both were introduced by 0026 (which added client_device_id,
-- reported_issue, technician_diagnosis, checklist, received_by, assigned_to
-- to quotes) without mirroring the extra guarantees 0014_rls_policies.sql
-- already gives service_orders for the same received_by/assigned_to/
-- created_by fields.

-- ============================================================================
-- 1. assigned_to/received_by, when set, must reference a profile in the
-- same company — same shape as service_orders_insert_own_company /
-- service_orders_update_own_company in 0014. Before this, a quote's
-- assigned_to/received_by could point at a profile from a different
-- company; it didn't leak that company's data (still row-scoped by
-- company_id), but it was a bad cross-tenant reference RLS should reject
-- outright, same as service_orders already does.
-- ============================================================================
alter policy "quotes_insert_own_company" on quotes
  with check (
    company_id = fn_current_company_id()
    and (created_by is null or created_by = auth.uid())
    and (
      assigned_to is null
      or exists (
        select 1 from profiles p where p.id = assigned_to and p.company_id = fn_current_company_id()
      )
    )
    and (
      received_by is null
      or exists (
        select 1 from profiles p where p.id = received_by and p.company_id = fn_current_company_id()
      )
    )
  );

alter policy "quotes_update_own_company" on quotes
  using (company_id = fn_current_company_id())
  with check (
    company_id = fn_current_company_id()
    and (
      assigned_to is null
      or exists (
        select 1 from profiles p where p.id = assigned_to and p.company_id = fn_current_company_id()
      )
    )
    and (
      received_by is null
      or exists (
        select 1 from profiles p where p.id = received_by and p.company_id = fn_current_company_id()
      )
    )
  );

-- ============================================================================
-- 2. created_by immutability — mirrors fn_service_orders_guard_created_by
-- (0014) exactly. A WITH CHECK only ever sees the resulting row, so it
-- can't express "leave this column alone" as distinct from "don't set it to
-- something new"; that's why this needs a trigger rather than another
-- policy clause. A no-op update (new value equal to old, including both
-- null) is allowed; any other change is rejected outright, regardless of
-- who's making it — even the owner can't reassign authorship of an
-- existing quote, same as service_orders.
-- ============================================================================
create or replace function fn_quotes_guard_created_by()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by não pode ser alterado após a criação do orçamento' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_quotes_guard_created_by
  before update on quotes
  for each row execute function fn_quotes_guard_created_by();
