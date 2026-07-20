-- Additive fields so Orçamentos can go through the same 6-step wizard as
-- Nova OS (device, diagnosis/checklist, and responsibility fields) — and so
-- an approved quote's conversion to a real OS can carry all of it forward,
-- not just client + line items.
alter table quotes
  add column client_device_id uuid references client_devices(id),
  -- Mirrors service_orders.reported_issue exactly, kept as its own column
  -- (not folded into the pre-existing free-form `notes`) so conversion to
  -- an OS carries it forward losslessly.
  add column reported_issue text,
  add column technician_diagnosis text,
  add column checklist jsonb not null default '{}'::jsonb,
  add column received_by uuid references profiles(id),
  add column assigned_to uuid references profiles(id);
