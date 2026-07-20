-- Funcionários — three concepts that were being conflated before, now kept
-- separate columns on profiles:
--   * app_access_enabled: a PRO-plan-limited seat count ("Acesso no App",
--     e.g. 0/3) — independent of module_permissions (a profile can see
--     every module it's been granted and still count against this limit,
--     or vice versa).
--   * bancada_intake / bancada_executor: whether this employee shows up as
--     an option in the Nova OS / Orçamento wizards' "Recebido Por" /
--     "Executor do Reparo" pickers — an eligibility flag, not a permission
--     and not the same as the per-OS received_by/assigned_to attribution
--     those wizards write.
--   * last_seen_at: updated on profile load (see use-auth.ts) — the
--     closest approximation to "last access" without needing service-role
--     access to auth.users.last_sign_in_at from the client.
alter table profiles
  add column app_access_enabled boolean not null default true,
  add column bancada_intake boolean not null default false,
  add column bancada_executor boolean not null default false,
  add column last_seen_at timestamptz;
