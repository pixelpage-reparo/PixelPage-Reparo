import type {
  CompanyPlan,
  ModuleKey,
  PaymentMethod,
  ProfileJobTitle,
  QuoteStatus,
  ResaleDeviceCondition,
  ServiceOrderStatus,
} from "@/types/domain"

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  mesa_fluxo: "Mesa/Fluxo",
  service_orders: "Ordens de Serviço",
  quotes: "Orçamentos",
  clients: "Clientes",
  inventory: "Peças",
  pos: "Venda de Produtos",
  resale_devices: "Aparelhos",
  showcase: "Vitrine Online",
  post_sale: "Pós-Venda",
  services_catalog: "Serviços",
  finance: "Financeiro",
  cash_register: "Caixa",
  reports: "Relatórios",
  team: "Funcionários",
  settings: "Minha Assistência",
}

export const MODULE_KEYS = Object.keys(MODULE_LABELS) as ModuleKey[]

/**
 * Sidebar structure: 3 named groups matching the product spec, in this
 * exact order. "settings" is deliberately absent — it's owner-only and
 * lives in AppTopbar's account menu, not module_permissions-gated nav.
 */
export const MODULE_GROUPS: { label: string; modules: ModuleKey[] }[] = [
  {
    label: "Gestão Operacional",
    modules: ["dashboard", "mesa_fluxo", "service_orders", "quotes"],
  },
  {
    label: "Clientes & Vendas",
    modules: ["clients", "inventory", "pos", "resale_devices", "showcase", "post_sale"],
  },
  {
    label: "Administrativo",
    modules: ["services_catalog", "finance", "cash_register", "reports", "team"],
  },
]

export const JOB_TITLE_LABELS: Record<ProfileJobTitle, string> = {
  tecnico: "Técnico",
  recepcionista: "Recepcionista",
  gerente: "Gerente",
}

/**
 * "Acesso no App" seat limit per plan tier — a UI-level display + soft
 * gate (disables the toggle at the limit), not enforced by real billing
 * infrastructure yet. The owner's own seat isn't counted against it.
 */
export const PLAN_APP_ACCESS_LIMITS: Record<CompanyPlan, number> = {
  trial: 3,
  active: 3,
  past_due: 3,
  canceled: 0,
}

/**
 * How long service_orders/quotes.device_unlock_secret_encrypted survives
 * after the order is settled (service_orders: status 'delivered'; quotes:
 * status 'convertido') before the pg_cron job in
 * 0028_device_unlock_secret.sql nulls it out. /api/device-secret/reveal
 * re-checks this same window as defense-in-depth, in case the cron job
 * hasn't run yet.
 */
export const DEVICE_UNLOCK_RETENTION_DAYS = 7

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

/**
 * Mesa/Fluxo's 5 fixed lanes, grouping the 7 active service_order_status
 * values — shared between the Mesa/Fluxo board (drag targets) and the
 * Dashboard (status-count cards), so both always reflect the same grouping.
 * `dropStatus` is the single status written when a card is dropped into a
 * lane that maps from more than one status (e.g. dropping into "Em
 * Análise" always sets "diagnosing" — "received" is intake-only, not
 * something you'd drag a card back into).
 */
export const SERVICE_ORDER_LANES: {
  key: string
  label: string
  statuses: ServiceOrderStatus[]
  dropStatus: ServiceOrderStatus
  accent: string
}[] = [
  {
    key: "em_analise",
    label: "Em Análise",
    statuses: ["received", "diagnosing", "awaiting_approval"],
    dropStatus: "diagnosing",
    accent: "bg-muted-foreground",
  },
  {
    key: "aguard_peca",
    label: "Aguard. Peça",
    statuses: ["awaiting_parts"],
    dropStatus: "awaiting_parts",
    accent: "bg-warning",
  },
  {
    key: "em_servico",
    label: "Em Serviço",
    statuses: ["in_repair"],
    dropStatus: "in_repair",
    accent: "bg-chart-1",
  },
  {
    key: "concluido",
    label: "Concluído",
    statuses: ["ready_for_pickup"],
    dropStatus: "ready_for_pickup",
    accent: "bg-success",
  },
  {
    key: "pago",
    label: "Pago",
    statuses: ["delivered"],
    dropStatus: "delivered",
    accent: "bg-success",
  },
]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  bank_transfer: "Transferência",
  other: "Outro",
}

export const QUOTE_STATUS_ORDER: QuoteStatus[] = ["pendente", "enviado", "aprovado", "recusado"]

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  convertido: "Convertido em OS",
}

export const QUOTE_STATUS_TONE: Record<
  QuoteStatus,
  "default" | "success" | "warning" | "destructive" | "muted"
> = {
  pendente: "muted",
  enviado: "warning",
  aprovado: "success",
  recusado: "destructive",
  convertido: "default",
}

export const RESALE_CONDITION_LABELS: Record<ResaleDeviceCondition, string> = {
  new: "Novo",
  sealed: "Lacrado",
  used_excellent: "Seminovo — excelente",
  used_good: "Usado — bom estado",
  used_fair: "Usado — estado regular",
}
