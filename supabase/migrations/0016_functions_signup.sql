-- Bootstraps a brand-new company + its owner profile in one transaction.
-- Called via supabase.rpc('fn_create_company_and_owner', {...}) right after
-- supabase.auth.signUp() succeeds — this is what avoids the RLS
-- chicken-and-egg problem (a user can't insert into profiles without a
-- profiles row already existing to satisfy fn_current_company_id()).
create or replace function fn_create_company_and_owner(p_company_name text, p_full_name text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_company_id uuid;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado' using errcode = 'P0001';
  end if;

  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Este usuário já pertence a uma empresa' using errcode = 'P0001';
  end if;

  -- Random suffix avoids slug collisions between two companies with the same name.
  v_slug := lower(regexp_replace(trim(p_company_name), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(md5(random()::text), 1, 6);

  insert into companies (name, slug)
  values (p_company_name, v_slug)
  returning id into v_company_id;

  insert into profiles (id, company_id, full_name, email, role)
  values (auth.uid(), v_company_id, p_full_name, auth.email(), 'owner');

  return v_company_id;
end;
$$;

grant execute on function fn_create_company_and_owner(text, text) to authenticated;
