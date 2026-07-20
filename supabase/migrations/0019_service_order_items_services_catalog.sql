-- Additive: lets a service line item reference the catalog entry (0018) it
-- was picked from — nullable, since custom/one-off services have none.
-- Added as its own migration (not folded into 0008_service_order_items.sql)
-- because services_catalog didn't exist yet at that point in migration
-- order.
alter table service_order_items
  add column services_catalog_id uuid references services_catalog(id);
