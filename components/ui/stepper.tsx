'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Horizontal scrollable stepper */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isUpcoming = stepNumber > currentStep

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold transition-colors",
                      {
                        "bg-primary border-primary text-primary-foreground": isCompleted,
                        "bg-primary border-primary text-primary-foreground": isCurrent,
                        "bg-background border-muted-foreground text-muted-foreground": isUpcoming,
                      }
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      {
                        "text-primary": isCompleted || isCurrent,
                        "text-muted-foreground": isUpcoming,
                      }
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-2 transition-colors",
                      {
                        "bg-primary": stepNumber < currentStep,
                        "bg-muted": stepNumber >= currentStep,
                      }
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors",
                    {
                      "bg-primary border-primary text-primary-foreground": isCompleted,
                      "bg-primary border-primary text-primary-foreground": isCurrent,
                      "bg-background border-muted-foreground text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    {
                      "text-primary": isCompleted || isCurrent,
                      "text-muted-foreground": isUpcoming,
                    }
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    {
                      "bg-primary": stepNumber < currentStep,
                      "bg-muted": stepNumber >= currentStep,
                    }
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}