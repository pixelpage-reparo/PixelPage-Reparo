-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Lifecycle of a Service Order (OS). `cancelled` is reachable from any
-- pre-`delivered` state; `delivered` and `cancelled` are both terminal.
create type service_order_status as enum (
  'received',
  'diagnosing',
  'awaiting_approval',
  'awaiting_parts',
  'in_repair',
  'ready_for_pickup',
  'delivered',
  'cancelled'
);

-- Generic updated_at maintenance, reused by every table below.
create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
