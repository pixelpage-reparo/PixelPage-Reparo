"use client"

import { Check } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface StepDef {
  id: string
  label: string
}

interface StepperContextValue {
  steps: StepDef[]
  currentIndex: number
  goTo: (index: number) => void
  next: () => void
  back: () => void
  isFirst: boolean
  isLast: boolean
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

/**
 * Read/control the active step from anywhere inside <Stepper>. Both the
 * Nova OS (6-step) and Aparelhos (7-step) wizards share this one primitive
 * — each wizard keeps a single react-hook-form instance for its entire
 * flow (not one form per step), and calls `next()` only after its own
 * `form.trigger(STEP_FIELDS[step])` validation passes.
 */
export function useStepper() {
  const ctx = React.useContext(StepperContext)
  if (!ctx) throw new Error("useStepper must be used within <Stepper>")
  return ctx
}

interface StepperProps {
  steps: StepDef[]
  children: React.ReactNode
  onStepChange?: (index: number) => void
}

export function Stepper({ steps, children, onStepChange }: StepperProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const goTo = React.useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), steps.length - 1)
      setCurrentIndex(clamped)
      onStepChange?.(clamped)
    },
    [steps.length, onStepChange]
  )

  const value = React.useMemo<StepperContextValue>(
    () => ({
      steps,
      currentIndex,
      goTo,
      next: () => goTo(currentIndex + 1),
      back: () => goTo(currentIndex - 1),
      isFirst: currentIndex === 0,
      isLast: currentIndex === steps.length - 1,
    }),
    [steps, currentIndex, goTo]
  )

  return <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
}

/** Numbered progress indicator — click a completed step to jump back to it. */
export function StepperHeader() {
  const { steps, currentIndex, goTo } = useStepper()

  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming"
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => index < currentIndex && goTo(index)}
                disabled={index >= currentIndex}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  state === "complete" && "bg-primary text-primary-foreground cursor-pointer",
                  state === "current" && "bg-primary/15 text-primary ring-primary ring-2",
                  state === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {state === "complete" ? <Check className="size-3.5" /> : index + 1}
              </button>
              <span
                className={cn(
                  "hidden max-w-20 text-center text-[0.7rem] leading-tight font-medium sm:block",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 h-px flex-1 sm:-mt-5",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/** Renders its children only while `index` is the active step. */
export function Step({ index, children }: { index: number; children: React.ReactNode }) {
  const { currentIndex } = useStepper()
  if (currentIndex !== index) return null
  return <>{children}</>
}

interface StepperFooterProps {
  onBack?: () => void
  onNext: () => void | Promise<void>
  nextLabel?: string
  backLabel?: string
  finishLabel?: string
  nextDisabled?: boolean
  submitting?: boolean
}

/**
 * Back/Next/Finish controls. `onNext` is always the wizard's own handler
 * (validate current step, then call stepper.next() — or submit, on the
 * last step) — this component never advances the step on its own, so
 * validation always runs first.
 */
export function StepperFooter({
  onBack,
  onNext,
  nextLabel,
  backLabel = "Voltar",
  finishLabel = "Concluir",
  nextDisabled,
  submitting,
}: StepperFooterProps) {
  const { isFirst, isLast, back } = useStepper()

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => {
          onBack?.()
          back()
        }}
        disabled={isFirst || submitting}
        className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        {backLabel}
      </button>

      <button
        type="button"
        onClick={() => void onNext()}
        disabled={nextDisabled || submitting}
        className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? "Salvando..." : (nextLabel ?? (isLast ? finishLabel : "Continuar"))}
      </button>
    </div>
  )
}
