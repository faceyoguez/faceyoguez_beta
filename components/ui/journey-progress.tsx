"use client"

import * as React from "react"
import { CheckCircle, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

export const JOURNEY_MILESTONES = [1, 7, 14, 21, 25]
export const JOURNEY_MAX_DAY = 25

interface JourneyProgressProps {
  /** Day elapsed since subscription start (calculated server/client side) */
  currentDay: number
  /** Currently selected milestone day for viewing logs */
  activeDay: number
  onSelectDay: (day: number) => void
  /** Set of day_numbers that have a completed log entry */
  completedDays: Set<number>
  className?: string
}

/**
 * JourneyProgress — A pink gradient progress bar with milestone markers.
 *
 * Milestones: Day 1 · 7 · 14 · 21 · 25
 * Each milestone dot shows:
 *  - Green checkmark  → has a completed journey log
 *  - Pink filled ring → current active milestone (today's nearest)
 *  - Gray empty ring  → future / not yet reached
 */
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
    <div className={cn("w-full select-none", className)}>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Journey Path
        </p>
        <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold text-pink-600">
          Day {Math.max(1, clampedDay)} / {JOURNEY_MAX_DAY}
        </span>
      </div>

      {/* Track + Milestones */}
      <div className="relative px-2">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 mx-2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-pink-100">
          {/* Filled portion */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 shadow-sm transition-all duration-700 ease-out"
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
              <button
                key={day}
                onClick={() => onSelectDay(day)}
                className="group relative flex flex-col items-center focus:outline-none"
                title={`Day ${day}`}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md transition-all duration-200",
                    isActive
                      ? "scale-110 border-pink-500 bg-white ring-4 ring-pink-200"
                      : isCompleted
                        ? "border-emerald-400 bg-emerald-50 hover:scale-105"
                        : isReached
                          ? "border-pink-400 bg-white hover:scale-105"
                          : "border-gray-200 bg-white hover:scale-105 hover:border-pink-200"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : isReached ? (
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      isActive ? "bg-pink-500" : "bg-pink-300"
                    )} />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                  )}

                  {/* Camera badge if has photo */}
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-500">
                      <Camera className="h-2 w-2 text-white" />
                    </span>
                  )}
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    "mt-2 text-[10px] font-bold transition-colors",
                    isActive
                      ? "text-pink-600"
                      : isCompleted
                        ? "text-emerald-600"
                        : isReached
                          ? "text-gray-500"
                          : "text-gray-300"
                  )}
                >
                  {day === 1 ? "Day 1" : `Day ${day}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] text-gray-400">Logged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-pink-400" />
          <span className="text-[10px] text-gray-400">Reached</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <span className="text-[10px] text-gray-400">Upcoming</span>
        </div>
      </div>
    </div>
  )
}
