-- ============================================================================
-- The atomic, race-safe, no-negative inventory write-off/restore core.
--
-- The `UPDATE ... WHERE quantity + delta >= 0` is what makes this race-safe:
-- Postgres takes the row lock as part of the UPDATE itself, so two
-- concurrent "attach same part" transactions serialize — the second
-- re-evaluates the WHERE clause against the already-decremented value, and
-- NOT FOUND triggers the hard-stop exception. The `quantity >= 0` CHECK
-- constraint on inventory_items (0010) is the belt-and-suspenders backstop.
-- ============================================================================
create or replace function fn_adjust_inventory_stock(
  p_inventory_item_id uuid,
  p_company_id uuid,
  p_delta integer,
  p_movement_type text,
  p_reference_type text,
  p_reference_id uuid,
  p_created_by uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_quantity integer;
begin
  if p_inventory_item_id is null then
    return;
  end if;

  if p_delta < 0 then
    update inventory_items
      set quantity = quantity + p_delta, updated_at = now()
      where id = p_inventory_item_id
        and company_id = p_company_id
        and quantity + p_delta >= 0
      returning quantity into v_new_quantity;

    if not found then
      raise exception 'Estoque insuficiente para o item de estoque %', p_inventory_item_id
        using errcode = 'P0001';
    end if;
  else
    update inventory_items
      set quantity = quantity + p_delta, updated_at = now()
      where id = p_inventory_item_id
        and company_id = p_company_id
      returning quantity into v_new_quantity;
  end if;

  insert into inventory_movements (
    company_id, inventory_item_id, movement_type, quantity_delta, reference_type, reference_id, created_by
  ) values (
    p_company_id, p_inventory_item_id, p_movement_type, p_delta, p_reference_type, p_reference_id, p_created_by
  );
end;
$$;

-- ============================================================================
-- service_order_items sync: write off on insert, restore-then-write-off on
-- update (handles both a quantity change and swapping which part is used),
-- restore on delete.
-- ============================================================================
create or replace function fn_service_order_items_inventory_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.kind = 'part' and new.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        new.inventory_item_id, new.company_id, -new.quantity,
        'write_off', 'service_order_item', new.id, auth.uid()
      );
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    if old.kind = 'part' and old.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        old.inventory_item_id, old.company_id, old.quantity,
        'restore', 'service_order_item', old.id, auth.uid()
      );
    end if;
    if new.kind = 'part' and new.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        new.inventory_item_id, new.company_id, -new.quantity,
        'write_off', 'service_order_item', new.id, auth.uid()
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    if old.kind = 'part' and old.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        old.inventory_item_id, old.company_id, old.quantity,
        'restore', 'service_order_item', old.id, auth.uid()
      );
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger trg_service_order_items_inventory_sync
  after insert or update or delete on service_order_items
  for each row execute function fn_service_order_items_inventory_sync();

-- Mirrors fn_service_order_items_inventory_sync() for POS sales.
create or replace function fn_sale_items_inventory_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        new.inventory_item_id, new.company_id, -new.quantity,
        'write_off', 'sale_item', new.id, auth.uid()
      );
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    if old.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        old.inventory_item_id, old.company_id, old.quantity,
        'restore', 'sale_item', old.id, auth.uid()
      );
    end if;
    if new.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        new.inventory_item_id, new.company_id, -new.quantity,
        'write_off', 'sale_item', new.id, auth.uid()
      );
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    if old.inventory_item_id is not null then
      perform fn_adjust_inventory_stock(
        old.inventory_item_id, old.company_id, old.quantity,
        'restore', 'sale_item', old.id, auth.uid()
      );
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger trg_sale_items_inventory_sync
  after insert or update or delete on sale_items
  for each row execute function fn_sale_items_inventory_sync();

-- ============================================================================
-- Cancellation restore: cancelling a service order (or sale) restores every
-- part line item's stock in one pass.
-- ============================================================================
create or replace function fn_service_order_cancel_restore()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_item record;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    for v_item in select * from service_order_items where service_order_id = new.id loop
      if v_item.kind = 'part' and v_item.inventory_item_id is not null then
        perform fn_adjust_inventory_stock(
          v_item.inventory_item_id, v_item.company_id, v_item.quantity,
          'restore', 'service_order_item', v_item.id, auth.uid()
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_service_orders_cancel_restore
  after update of status on service_orders
  for each row execute function fn_service_order_cancel_restore();

create or replace function fn_sale_cancel_restore()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_item record;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    for v_item in select * from sale_items where sale_id = new.id loop
      if v_item.inventory_item_id is not null then
        perform fn_adjust_inventory_stock(
          v_item.inventory_item_id, v_item.company_id, v_item.quantity,
          'restore', 'sale_item', v_item.id, auth.uid()
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_sales_cancel_restore
  after update of status on sales
  for each row execute function fn_sale_cancel_restore();

-- ============================================================================
-- Guard: once a parent OS/sale is cancelled, its line items become
-- immutable. This is what prevents a double-restore (cancel-trigger
-- restores once; without this guard, someone could then delete the item
-- and the DELETE-branch of the sync trigger would restore it a second time).
-- BEFORE triggers, so they abort before the AFTER sync triggers ever run.
-- ============================================================================
create or replace function fn_service_order_items_guard_locked_parent()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_status service_order_status;
begin
  select status into v_status from service_orders
    where id = coalesce(new.service_order_id, old.service_order_id);

  if v_status = 'cancelled' then
    raise exception 'Não é possível alterar itens de uma OS cancelada' using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_service_order_items_guard_locked_parent
  before insert or update or delete on service_order_items
  for each row execute function fn_service_order_items_guard_locked_parent();

create or replace function fn_sale_items_guard_locked_parent()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from sales
    where id = coalesce(new.sale_id, old.sale_id);

  if v_status = 'cancelled' then
    raise exception 'Não é possível alterar itens de uma venda cancelada' using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_sale_items_guard_locked_parent
  before insert or update or delete on sale_items
  for each row execute function fn_sale_items_guard_locked_parent();
