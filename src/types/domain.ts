export type ServiceOrderStatus =
  | "received"
  | "diagnosing"
  | "awaiting_approval"
  | "awaiting_parts"
  | "in_repair"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled"

export type ModuleKey =
  | "dashboard"
  | "mesa_fluxo"
  | "service_orders"
  | "quotes"
  | "clients"
  | "inventory"
  | "pos"
  | "resale_devices"
  | "showcase"
  | "post_sale"
  | "services_catalog"
  | "finance"
  | "cash_register"
  | "reports"
  | "team"
  | "settings"

export type PaymentMethod =
  | "cash"
  | "pix"
  | "debit"
  | "credit"
  | "bank_transfer"
  | "other"

export type ProfileRole = "owner" | "employee"

/**
 * Purely descriptive "cargo" label — orthogonal to `ProfileRole` and to
 * module_permissions. Selecting a job title never changes what modules an
 * employee can see; the owner still controls that per-module, exactly as
 * before. Kept separate from ProfileRole so the owner/employee bypass logic
 * in fn_has_module_access() never has to reason about more than two values.
 */
export type ProfileJobTitle = "tecnico" | "recepcionista" | "gerente"

export type ResaleDeviceCondition =
  | "new"
  | "sealed"
  | "used_excellent"
  | "used_good"
  | "used_fair"

export type ResaleDeviceAcquisitionSource =
  | "fornecedor"
  | "comprado_de_cliente"
  | "recebido_em_troca"
  | "estoque_proprio"
  | "consignado"

export type ServiceOrderItemKind = "service" | "part"

export type QuoteStatus = "pendente" | "enviado" | "aprovado" | "recusado" | "convertido"

export type FinancialTransactionType = "income" | "expense"

export type SaleStatus = "completed" | "cancelled"

export type CompanyPlan = "trial" | "active" | "past_due" | "canceled"

export type Currency = "BRL" | "USD" | "EUR"
