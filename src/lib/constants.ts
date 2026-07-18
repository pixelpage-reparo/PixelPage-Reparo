import type {
  ModuleKey,
  PaymentMethod,
  ResaleDeviceCondition,
  ServiceOrderStatus,
} from "@/types/domain"

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  service_orders: "Ordens de Serviço",
  clients: "Clientes",
  inventory: "Estoque",
  finance: "Financeiro",
  team: "Equipe",
  pos: "PDV",
  showcase: "Vitrine",
}

export const MODULE_KEYS = Object.keys(MODULE_LABELS) as ModuleKey[]

export const SERVICE_ORDER_STATUS_ORDER: ServiceOrderStatus[] = [
  "received",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_repair",
  "ready_for_pickup",
  "delivered",
]

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  received: "Recebido",
  diagnosing: "Diagnóstico",
  awaiting_approval: "Aguardando aprovação",
  awaiting_parts: "Aguardando peça",
  in_repair: "Em reparo",
  ready_for_pickup: "Pronto pra retirada",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

export const SERVICE_ORDER_STATUS_TONE: Record<
  ServiceOrderStatus,
  "default" | "success" | "warning" | "destructive" | "muted"
> = {
  received: "muted",
  diagnosing: "default",
  awaiting_approval: "warning",
  awaiting_parts: "warning",
  in_repair: "default",
  ready_for_pickup: "success",
  delivered: "success",
  cancelled: "destructive",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  bank_transfer: "Transferência",
  other: "Outro",
}

export const RESALE_CONDITION_LABELS: Record<ResaleDeviceCondition, string> = {
  new: "Novo",
  sealed: "Lacrado",
  used_excellent: "Seminovo — excelente",
  used_good: "Usado — bom estado",
  used_fair: "Usado — estado regular",
}
