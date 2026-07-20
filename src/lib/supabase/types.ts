/**
 * Hand-authored placeholder for the Supabase generated Database type.
 * Mirrors supabase/migrations/*.sql. Once a real project exists, replace
 * this file with the output of `supabase gen types typescript`.
 */
import type {
  Currency,
  CompanyPlan,
  FinancialTransactionType,
  ModuleKey,
  PaymentMethod,
  ProfileJobTitle,
  ProfileRole,
  QuoteStatus,
  ResaleDeviceAcquisitionSource,
  ResaleDeviceCondition,
  SaleStatus,
  ServiceOrderItemKind,
  ServiceOrderStatus,
} from "@/types/domain"

/**
 * Columns with a DB-side default become optional on Insert. Update is
 * always a partial Row. `Relationships: []` is a required field on
 * supabase-js's GenericTable/GenericView — real `supabase gen types` output
 * fills it with actual FK metadata for embedded (`select("*, clients(*)")`)
 * queries; left empty here since this is a hand-authored placeholder.
 */
type Table<Row, DefaultableKeys extends keyof Row = never> = {
  Row: Row
  Insert: Partial<Pick<Row, DefaultableKeys>> & Omit<Row, DefaultableKeys>
  Update: Partial<Row>
  Relationships: never[]
}

export interface Database {
  public: {
    Tables: {
      companies: Table<
        {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          currency: Currency
          daily_goal_cents: number
          plan: CompanyPlan
          trial_ends_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          whatsapp_number: string | null
          address_cep: string | null
          address_street: string | null
          address_number: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_city: string | null
          address_state: string | null
          language: "pt-BR" | "es" | "en"
          warranty_terms_text: string | null
          photo_retention_days: number
          google_review_url: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "logo_url" | "primary_color" | "currency" | "daily_goal_cents"
        | "plan" | "trial_ends_at" | "stripe_customer_id" | "stripe_subscription_id"
        | "whatsapp_number" | "address_cep" | "address_street" | "address_number"
        | "address_complement" | "address_neighborhood" | "address_city" | "address_state"
        | "language" | "warranty_terms_text" | "photo_retention_days" | "google_review_url"
        | "created_at" | "updated_at"
      >
      profiles: Table<
        {
          id: string
          company_id: string
          full_name: string
          email: string
          avatar_url: string | null
          role: ProfileRole
          job_title: ProfileJobTitle | null
          app_access_enabled: boolean
          bancada_intake: boolean
          bancada_executor: boolean
          last_seen_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        },
        | "avatar_url" | "role" | "job_title" | "app_access_enabled" | "bancada_intake"
        | "bancada_executor" | "last_seen_at" | "is_active" | "created_at" | "updated_at"
      >
      module_permissions: Table<
        {
          id: string
          profile_id: string
          company_id: string
          module_key: ModuleKey
          can_view: boolean
          can_edit: boolean
          can_delete: boolean
          created_at: string
          updated_at: string
        },
        "id" | "can_view" | "can_edit" | "can_delete" | "created_at" | "updated_at"
      >
      clients: Table<
        {
          id: string
          company_id: string
          full_name: string
          phone: string
          email: string | null
          document: string | null
          notes: string | null
          birth_date: string | null
          created_at: string
          updated_at: string
        },
        "id" | "email" | "document" | "notes" | "birth_date" | "created_at" | "updated_at"
      >
      client_devices: Table<
        {
          id: string
          client_id: string
          company_id: string
          brand: string | null
          model: string | null
          color: string | null
          serial_or_imei: string | null
          notes: string | null
          created_at: string
          updated_at: string
        },
        "id" | "brand" | "model" | "color" | "serial_or_imei" | "notes" | "created_at" | "updated_at"
      >
      service_orders: Table<
        {
          id: string
          company_id: string
          os_number: number
          client_id: string | null
          client_device_id: string | null
          status: ServiceOrderStatus
          checklist: Record<string, unknown>
          reported_issue: string | null
          technician_diagnosis: string | null
          received_by: string | null
          assigned_to: string | null
          warranty_days: number
          warranty_notes: string | null
          subtotal_cents: number
          discount_cents: number
          total_cents: number
          signature_data_url: string | null
          signed_at: string | null
          delivered_at: string | null
          device_unlock_secret_encrypted: string | null
          // Generated column (0030) — never selected directly by anyone;
          // read this instead of device_unlock_secret_encrypted to know
          // whether an order has a secret saved, since the real column is
          // column-level revoked from `authenticated` and always comes back
          // null/omitted for a normal client query.
          has_device_unlock_secret: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "os_number" | "client_id" | "client_device_id" | "status" | "checklist"
        | "reported_issue" | "technician_diagnosis" | "received_by" | "assigned_to" | "warranty_days"
        | "warranty_notes" | "subtotal_cents" | "discount_cents" | "total_cents"
        | "signature_data_url" | "signed_at" | "delivered_at" | "device_unlock_secret_encrypted"
        | "has_device_unlock_secret" | "created_by"
        | "created_at" | "updated_at"
      >
      service_order_status_history: Table<
        {
          id: string
          service_order_id: string
          company_id: string
          status: ServiceOrderStatus
          changed_by: string | null
          note: string | null
          created_at: string
        },
        "id" | "changed_by" | "note" | "created_at"
      >
      service_order_items: Table<
        {
          id: string
          service_order_id: string
          company_id: string
          kind: ServiceOrderItemKind
          inventory_item_id: string | null
          services_catalog_id: string | null
          description: string
          quantity: number
          unit_price_cents: number
          total_cents: number
          created_at: string
          updated_at: string
        },
        | "id" | "inventory_item_id" | "services_catalog_id" | "quantity"
        | "unit_price_cents" | "total_cents" | "created_at" | "updated_at"
      >
      service_order_photos: Table<
        {
          id: string
          service_order_id: string
          company_id: string
          storage_path: string
          stage: "entry" | "diagnosis" | "repair" | "delivery"
          caption: string | null
          created_by: string | null
          created_at: string
        },
        "id" | "caption" | "created_by" | "created_at"
      >
      inventory_items: Table<
        {
          id: string
          company_id: string
          name: string
          category: string | null
          sku: string | null
          unit: string
          quantity: number
          min_quantity_alert: number
          cost_cents: number
          sale_price_cents: number
          is_active: boolean
          created_at: string
          updated_at: string
        },
        | "id" | "category" | "sku" | "unit" | "quantity" | "min_quantity_alert"
        | "cost_cents" | "sale_price_cents" | "is_active" | "created_at" | "updated_at"
      >
      inventory_movements: Table<
        {
          id: string
          company_id: string
          inventory_item_id: string
          movement_type: "write_off" | "restore" | "manual_adjustment" | "initial_stock"
          quantity_delta: number
          reference_type: "service_order_item" | "sale_item" | "manual" | null
          reference_id: string | null
          created_by: string | null
          created_at: string
        },
        "id" | "reference_type" | "reference_id" | "created_by" | "created_at"
      >
      sales: Table<
        {
          id: string
          company_id: string
          service_order_id: string | null
          client_id: string | null
          status: SaleStatus
          payment_method: PaymentMethod | null
          subtotal_cents: number
          discount_cents: number
          total_cents: number
          sold_by: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "service_order_id" | "client_id" | "status" | "payment_method"
        | "subtotal_cents" | "discount_cents" | "total_cents" | "sold_by"
        | "created_at" | "updated_at"
      >
      sale_items: Table<
        {
          id: string
          sale_id: string
          company_id: string
          inventory_item_id: string | null
          description: string
          quantity: number
          unit_price_cents: number
          total_cents: number
          created_at: string
          updated_at: string
        },
        "id" | "inventory_item_id" | "quantity" | "unit_price_cents" | "total_cents" | "created_at" | "updated_at"
      >
      financial_transactions: Table<
        {
          id: string
          company_id: string
          type: FinancialTransactionType
          category: string
          amount_cents: number
          payment_method: PaymentMethod | null
          reference_type: "service_order" | "sale" | "manual" | null
          reference_id: string | null
          description: string | null
          occurred_on: string
          created_by: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "payment_method" | "reference_type" | "reference_id" | "description"
        | "occurred_on" | "created_by" | "created_at" | "updated_at"
      >
      resale_devices: Table<
        {
          id: string
          company_id: string
          brand: string
          model: string
          storage_capacity: string | null
          color: string | null
          imei: string | null
          condition: ResaleDeviceCondition
          cost_cents: number
          price_cents: number
          description: string | null
          status: "available" | "reserved" | "sold"
          is_public: boolean
          acquisition_source: ResaleDeviceAcquisitionSource | null
          acquisition_source_name: string | null
          repair_cost_cents: number
          min_price_cents: number | null
          warranty_months: number
          physical_location: string | null
          accompanying_items: string[]
          created_at: string
          updated_at: string
        },
        | "id" | "storage_capacity" | "color" | "imei" | "cost_cents" | "description"
        | "status" | "is_public" | "acquisition_source" | "acquisition_source_name"
        | "repair_cost_cents" | "min_price_cents" | "warranty_months" | "physical_location"
        | "accompanying_items" | "created_at" | "updated_at"
      >
      resale_device_photos: Table<
        {
          id: string
          resale_device_id: string
          company_id: string
          storage_path: string
          position: number
          created_at: string
        },
        "id" | "position" | "created_at"
      >
      showcase_settings: Table<
        {
          id: string
          company_id: string
          is_enabled: boolean
          whatsapp_number: string | null
          headline: string | null
          show_prices: boolean
          created_at: string
          updated_at: string
        },
        "id" | "is_enabled" | "whatsapp_number" | "headline" | "show_prices" | "created_at" | "updated_at"
      >
      services_catalog: Table<
        {
          id: string
          company_id: string
          name: string
          category: string | null
          default_price_cents: number
          estimated_duration_minutes: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        },
        | "id" | "category" | "default_price_cents" | "estimated_duration_minutes"
        | "is_active" | "created_at" | "updated_at"
      >
      quotes: Table<
        {
          id: string
          company_id: string
          quote_number: number
          client_id: string | null
          client_device_id: string | null
          status: QuoteStatus
          device_description: string | null
          reported_issue: string | null
          technician_diagnosis: string | null
          checklist: Record<string, unknown>
          notes: string | null
          subtotal_cents: number
          discount_cents: number
          total_cents: number
          received_by: string | null
          assigned_to: string | null
          service_order_id: string | null
          device_unlock_secret_encrypted: string | null
          // Generated column (0030) — see the identical note on
          // service_orders.has_device_unlock_secret above.
          has_device_unlock_secret: boolean
          converted_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "quote_number" | "client_id" | "client_device_id" | "status" | "device_description"
        | "reported_issue" | "technician_diagnosis" | "checklist" | "notes" | "subtotal_cents" | "discount_cents"
        | "total_cents" | "received_by" | "assigned_to" | "service_order_id"
        | "device_unlock_secret_encrypted" | "has_device_unlock_secret" | "converted_at"
        | "created_by" | "created_at" | "updated_at"
      >
      quote_items: Table<
        {
          id: string
          quote_id: string
          company_id: string
          kind: ServiceOrderItemKind
          inventory_item_id: string | null
          services_catalog_id: string | null
          description: string
          quantity: number
          unit_price_cents: number
          total_cents: number
          created_at: string
          updated_at: string
        },
        | "id" | "inventory_item_id" | "services_catalog_id" | "quantity"
        | "unit_price_cents" | "total_cents" | "created_at" | "updated_at"
      >
      message_templates: Table<
        {
          id: string
          company_id: string
          template_key: string
          channel: "whatsapp" | "email"
          body: string
          is_active: boolean
          created_at: string
          updated_at: string
        },
        "id" | "channel" | "is_active" | "created_at" | "updated_at"
      >
      payment_method_fees: Table<
        {
          id: string
          company_id: string
          payment_method: "cash" | "pix" | "debit" | "credit"
          installments: number
          fee_percent: number
          created_at: string
          updated_at: string
        },
        "id" | "installments" | "fee_percent" | "created_at" | "updated_at"
      >
      cash_register_sessions: Table<
        {
          id: string
          company_id: string
          opened_by: string | null
          opened_at: string
          starting_float_cents: number
          closed_by: string | null
          closed_at: string | null
          counted_total_cents: number | null
          expected_total_cents: number | null
          discrepancy_cents: number | null
          status: "open" | "closed"
          notes: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "opened_by" | "opened_at" | "starting_float_cents" | "closed_by" | "closed_at"
        | "counted_total_cents" | "expected_total_cents" | "discrepancy_cents" | "status" | "notes"
        | "created_at" | "updated_at"
      >
      recurring_expense_rules: Table<
        {
          id: string
          company_id: string
          description: string
          amount_cents: number
          category: string
          frequency: "monthly" | "weekly"
          day_of_month: number | null
          is_active: boolean
          last_generated_on: string | null
          created_at: string
          updated_at: string
        },
        | "id" | "category" | "frequency" | "day_of_month" | "is_active" | "last_generated_on"
        | "created_at" | "updated_at"
      >
    }
    Views: {
      v_client_totals: {
        Row: {
          client_id: string
          company_id: string
          total_spent_cents: number
          last_service_at: string | null
        }
        Relationships: never[]
      }
    }
    Functions: {
      fn_create_company_and_owner: {
        Args: { p_company_name: string; p_full_name: string }
        Returns: string
      }
      fn_adjust_inventory_stock: {
        Args: {
          p_inventory_item_id: string
          p_company_id: string
          p_delta: number
          p_movement_type: "write_off" | "restore" | "manual_adjustment" | "initial_stock"
          p_reference_type: "service_order_item" | "sale_item" | "manual" | null
          p_reference_id: string | null
          p_created_by: string | null
        }
        Returns: void
      }
      fn_get_device_secret_ciphertext: {
        Args: { record_id: string; record_type: "service_order" | "quote" }
        Returns: string
      }
      fn_copy_quote_device_secret: {
        Args: { p_quote_id: string; p_service_order_id: string }
        Returns: void
      }
    }
    Enums: {
      service_order_status: ServiceOrderStatus
    }
  }
}
