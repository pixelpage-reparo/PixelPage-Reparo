-- Device unlock secret (PIN/pattern) — collected in the Nova OS and
-- Orçamento wizards but, until now, deliberately never persisted (kept in
-- wizard-local React state only, with an on-screen warning). This migration
-- adds real at-rest storage: the column only ever holds AES-256-GCM
-- ciphertext, produced by src/lib/server/device-secret.ts using a key that
-- lives in DEVICE_SECRET_ENCRYPTION_KEY (server-side env var — never in a
-- migration, never NEXT_PUBLIC_, never hardcoded). Reads/writes only happen
-- through /api/device-secret and /api/device-secret/reveal, which re-check
-- authorization server-side. Postgres itself never holds the key and can't
-- decrypt this column — pgcrypto was deliberately not used for that reason.

alter table service_orders
  add column device_unlock_secret_encrypted text;

alter table quotes
  add column device_unlock_secret_encrypted text,
  -- Set once by useConvertQuoteToServiceOrder, mirroring how
  -- service_orders.delivered_at (0006) is set once by
  -- useUpdateServiceOrderStatus — both anchor the 7-day purge window below.
  add column converted_at timestamptz;

comment on column service_orders.device_unlock_secret_encrypted is
  'AES-256-GCM ciphertext (iv:authTag:ciphertext, base64-joined) of the device unlock PIN/pattern. Never plaintext at rest. Encrypt/decrypt only via the /api/device-secret routes — no application code should read this column directly and render it.';
comment on column quotes.device_unlock_secret_encrypted is
  'Same shape as service_orders.device_unlock_secret_encrypted. Copied verbatim (still ciphertext, no re-encryption needed) into the resulting service_orders row when a quote converts.';

-- ============================================================================
-- Retention: purge the secret 7 days after the order reaches the terminal
-- "settled" state — service_orders when status = 'delivered' (the "Pago"
-- lane in Mesa/Fluxo), quotes when status = 'convertido' (at that point the
-- OS created from it already carries its own copy, per above).
--
-- NOT done via pg_cron: this project's pg_cron availability couldn't be
-- confirmed (the connected Supabase project isn't reachable through the
-- tooling used to write this migration), so per instruction the purge was
-- moved to an app-layer job instead — see
-- src/app/api/cron/purge-device-secrets/route.ts, triggered by Vercel Cron
-- (schedule declared in vercel.json). That route runs the exact same two
-- UPDATE statements this comment used to schedule via cron.schedule(), just
-- issued from Node with the service-role key instead of from Postgres
-- itself. If pg_cron does turn out to be available and you'd rather run
-- this in-database, that route can be deleted and a cron.schedule() call
-- restored here instead — the two are equivalent.
-- ============================================================================
