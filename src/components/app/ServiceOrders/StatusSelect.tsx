import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_STATUS_ORDER } from "@/lib/constants"
import type { ServiceOrderStatus } from "@/types/domain"

interface StatusSelectProps {
  value: ServiceOrderStatus
  onChange: (status: ServiceOrderStatus) => void
  disabled?: boolean
}

const ALL_STATUSES: ServiceOrderStatus[] = [...SERVICE_ORDER_STATUS_ORDER, "cancelled"]

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ServiceOrderStatus)} disabled={disabled}>
      <SelectTrigger className="h-8 w-full text-xs" onClick={(e) => e.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {ALL_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {SERVICE_ORDER_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
