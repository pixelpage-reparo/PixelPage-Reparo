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
  | "service_orders"
  | "clients"
  | "inventory"
  | "finance"
  | "team"
  | "pos"
  | "showcase"

export type PaymentMethod =
  | "cash"
  | "pix"
  | "debit"
  | "credit"
  | "bank_transfer"
  | "other"

export type ProfileRole = "owner" | "employee"

export type ResaleDeviceCondition =
  | "new"
  | "sealed"
  | "used_excellent"
  | "used_good"
  | "used_fair"

export type ServiceOrderItemKind = "service" | "part"

export type FinancialTransactionType = "income" | "expense"

export type SaleStatus = "completed" | "cancelled"

export type CompanyPlan = "trial" | "active" | "past_due" | "canceled"

export type Currency = "BRL" | "USD" | "EUR"
