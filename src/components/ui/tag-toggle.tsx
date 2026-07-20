import { cn } from "@/lib/utils"

interface TagToggleProps {
  label: string
  selected: boolean
  onToggle: () => void
}

/** Small pill-shaped multi-select tag, shared by the Nova OS, Aparelhos, and Orçamentos wizards. */
export function TagToggle({ label, selected, onToggle }: TagToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40"
      )}
    >
      {label}
    </button>
  )
}
