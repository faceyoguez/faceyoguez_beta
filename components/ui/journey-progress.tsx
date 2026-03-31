"use client"

import * as React from "react"
import { CheckCircle, Camera, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export const JOURNEY_MILESTONES = [1, 7, 14, 21, 25, 30]
export const JOURNEY_MAX_DAY = 30

interface JourneyProgressProps {
  currentDay: number
  activeDay: number
  onSelectDay?: (day: number) => void
  completedDays: Set<number>
  className?: string
}

export function JourneyProgress({
  currentDay,
  activeDay,
  onSelectDay,
  completedDays,
  className,
}: JourneyProgressProps) {
  const clampedDay = Math.min(currentDay, JOURNEY_MAX_DAY)
  const progressPct = Math.min(100, Math.max(0, ((clampedDay - 1) / (JOURNEY_MAX_DAY - 1)) * 100))

  return (
    <div className={cn("w-full select-none space-y-8", className)}>
      {/* Track + Milestones */}
      <div className="relative px-4">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 mx-4 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/5">
          {/* Filled portion */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.2)] transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Milestone dots */}
        <div className="relative flex items-center justify-between">
          {JOURNEY_MILESTONES.map((day) => {
            const isCompleted = completedDays.has(day)
            const isActive = activeDay === day
            const isReached = day <= clampedDay

            return (
              <div
                key={day}
                className="group relative flex flex-col items-center"
                title={`Ritual Day ${day}`}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-500 shadow-xl",
                    isActive
                      ? "scale-105 border-foreground bg-foreground text-background"
                      : isCompleted
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : isReached
                          ? "border-primary/20 bg-white text-primary/60"
                          : "border-primary/5 bg-white/50 text-foreground/10"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isReached ? (
                    <span className="text-[10px] font-black">{day}</span>
                  ) : (
                    <Sparkles className="h-4 w-4 opacity-20" />
                  )}

                  {/* Photo badge */}
                  {isCompleted && !isActive && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-lg bg-primary shadow-lg border border-white/20">
                      <Camera className="h-2 w-2 text-white" />
                    </span>
                  )}
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    "absolute top-12 whitespace-nowrap text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    isActive
                      ? "text-foreground opacity-100"
                      : "text-foreground/20 opacity-0 group-hover:opacity-100"
                  )}
                >
                  Day {day}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
