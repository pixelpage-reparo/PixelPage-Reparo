-- Additive fields for the Aparelhos module's 7-step cadastro wizard —
-- resale_devices (0013) already covers identification/condition/cost/price/
-- IMEI/status/is_public; this adds the remaining spec fields: where the
-- device came from, its warranty term, the negotiation-floor price (team-
-- only, never shown to the public storefront), and its physical location.
alter table resale_devices
  add column acquisition_source text check (
    acquisition_source in ('fornecedor', 'comprado_de_cliente', 'recebido_em_troca', 'estoque_proprio', 'consignado')
  ),
  add column acquisition_source_name text,
  add column repair_cost_cents bigint not null default 0,
  add column min_price_cents bigint,
  add column warranty_months integer not null default 0,
  add column physical_location text,
  -- "O que acompanha o aparelho" (caixa, carregador, cabo...) — shown on the
  -- device's public vitrine page. A plain string array, not a lookup table:
  -- these are free-form tags plus an optional custom one, not a reusable
  -- catalog like services_catalog.
  add column accompanying_items jsonb not null default '[]'::jsonb;
