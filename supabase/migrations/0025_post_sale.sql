-- Pós-Venda & Reputação — Google review link (single value, lives on
-- companies like other single-per-company settings) and clients.birth_date
-- (needed for the Aniversariantes tab; nothing in the schema captured this
-- before). Warranties themselves aren't a new table — they're derived from
-- delivered service_orders + warranty_days, computed at query time.
alter table companies add column google_review_url text;
alter table clients add column birth_date date;
