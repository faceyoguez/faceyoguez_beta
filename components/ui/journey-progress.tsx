"use client"

import * as React from "react"
import { CheckCircle, Camera, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export const JOURNEY_MILESTONES = [1, 7, 14, 21, 25, 30]
export const JOURNEY_MAX_DAY = 30

/**
 * Generates a 6-point milestone spread for a journey of arbitrary length,
 * keeping the same relative cadence as the original 30-day milestones
 * ([1, 7, 14, 21, 25, 30] → ~3%, 23%, 47%, 70%, 83%, 100%).
 * Used for plans whose duration isn't the default 30 days (e.g. group-session
 * plans, which run 40 or 110 days).
 */
export function getJourneyMilestones(maxDay: number): number[] {
  if (maxDay === JOURNEY_MAX_DAY) return JOURNEY_MILESTONES
  const ratios = [1 / 30, 7 / 30, 14 / 30, 21 / 30, 25 / 30, 1]
  const days = ratios.map((r) => Math.max(1, Math.round(r * maxDay)))
  days[0] = 1
  days[days.length - 1] = maxDay
  // De-dupe in case rounding collapses two points together on short journeys
  return Array.from(new Set(days)).sort((a, b) => a - b)
}

/**
 * Total length (in days) of a group-session plan's journey — 40 days for the
 * 1-month plan, 110 for the 3-month plan (matching the subscription end-date
 * math in lib/actions/batches.ts and the Razorpay payment routes). Falls back
 * to the legacy 30-day span when the duration is unknown.
 */
export function getGroupJourneyLength(durationMonths?: number | null): number {
  if (durationMonths === 1) return 40
  if (durationMonths === 3) return 110
  return JOURNEY_MAX_DAY
}

interface JourneyProgressProps {
  currentDay: number
  activeDay: number
  onSelectDay?: (day: number) => void
  completedDays: Set<number>
  className?: string
  /** Total length of this journey in days. Defaults to the standard 30-day program. */
  maxDay?: number
  /** Milestone days to render along the track. Defaults to the standard 30-day milestones. */
  milestones?: number[]
}

export function JourneyProgress({
  currentDay,
  activeDay,
  onSelectDay,
  completedDays,
  className,
  maxDay = JOURNEY_MAX_DAY,
  milestones = JOURNEY_MILESTONES,
}: JourneyProgressProps) {
  const clampedDay = Math.min(currentDay, maxDay)
  const progressPct = Math.min(100, Math.max(0, ((clampedDay - 1) / (maxDay - 1)) * 100))

  return (
    <div className={cn("w-full select-none space-y-12 min-h-[100px] flex flex-col justify-center", className)}>
      {/* Track + Milestones */}
      <div className="relative px-4">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 mx-4 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/5">
          {/* Filled portion */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.2)] transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Milestone dots */}
        <div className="relative flex items-center justify-between">
          {milestones.map((day) => {
            const isCompleted = completedDays.has(day)
            const isActive = activeDay === day
            const isReached = day <= clampedDay

            return (
              <div
                key={day}
                className={cn(
                  "group relative flex flex-col items-center transition-all duration-300",
                  isReached ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-not-allowed"
                )}
                onClick={() => isReached && onSelectDay?.(day)}
                title={`Day ${day}`}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-500 shadow-lg",
                    isActive
                      ? "scale-105 border-foreground bg-foreground text-background"
                      : isCompleted
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : isReached
                          ? "border-primary/20 bg-white text-primary/60"
                          : "border-primary/5 bg-white/50 text-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isReached ? (
                    <span className="text-[9px] font-black">{day}</span>
                  ) : (
                    <span className="text-[9px] font-black opacity-60">{day}</span>
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
                    "absolute top-10 whitespace-nowrap text-[7px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    isReached
                      ? "text-foreground opacity-90"
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
