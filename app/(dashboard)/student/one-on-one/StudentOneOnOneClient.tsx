'use client';

import { useState } from 'react';
import { OneOnOneChat } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  FileText,
  Eye,
  Download,
  Lightbulb,
  Edit3,
  Camera,
  CheckCircle,
} from 'lucide-react';
import type { Profile } from '@/types/database';

interface Props {
  currentUser: Profile;
  hasSubscription: boolean;
}

export function StudentOneOnOneClient({ currentUser, hasSubscription }: Props) {
  const [sliderValue, setSliderValue] = useState(50);

  if (!hasSubscription) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900">No Active Subscription</h2>
          <p className="mt-2 text-gray-500">
            You need an active one-on-one subscription to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Your"
        highlight="1-on-1 Hub"
        description="Track progress and connect with your instructor"
      />

      {/* ── Top row: Chat + Side panels ── */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chat */}
        <OneOnOneChat
          currentUser={currentUser}
          className="h-[480px]"
        />

        {/* Side panels */}
        <div className="flex h-[480px] flex-col gap-4">
          {/* Next session card */}
          <div className="group relative h-[140px] shrink-0 overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-pink-200/20">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl transition-transform duration-700 group-hover:scale-110" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold leading-tight">Next Session</h3>
                  <p className="mt-0.5 text-xs font-medium text-pink-100">Technique Review</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/20 p-2 backdrop-blur-md">
                  <Video className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5" /> Sep 24
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5" /> 10:00 AM
                  </div>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-pink-600 shadow-sm transition-all hover:bg-pink-50">
                  Join <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="h-[180px] shrink-0 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Guidelines & Plan</h3>
              <div className="rounded bg-pink-50 p-1 text-pink-500">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white bg-pink-50 text-pink-500 shadow-sm transition-transform group-hover:scale-105">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-xs font-bold text-gray-800">Face Yoga Plan.pdf</h4>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded bg-white/60 px-1.5 text-[10px] text-gray-500">2.4 MB</span>
                  <span className="text-[10px] font-bold text-pink-500">Updated today</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button className="rounded-lg border border-gray-100 bg-white p-1.5 text-gray-600 shadow-sm transition-colors hover:bg-gray-50">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-pink-100 bg-pink-50 p-1.5 text-pink-600 shadow-sm transition-colors hover:bg-pink-100">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekly wisdom */}
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
            <div className="absolute -right-6 -top-6 pointer-events-none h-24 w-24 rounded-full bg-amber-100 opacity-50 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-500 shadow-sm">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold text-gray-700">Weekly Wisdom</h4>
                <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">
                  Remember to keep your shoulders relaxed during the jaw exercises. Tension in the
                  neck can reduce effectiveness of the facial movements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transformation Journey ── */}
      <div className="w-full rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              Transformation Journey
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600">
                Week 3
              </span>
            </h3>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              Visual progress tracking & daily feedback
            </p>
          </div>
        </div>

        {/* Journey path */}
        <div className="relative mb-10 px-4">
          <h4 className="mb-6 text-sm font-bold text-gray-700">Journey Path</h4>
          <div className="relative w-full">
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-pink-200 via-pink-200 to-gray-200" />
            <div className="relative z-10 flex w-full items-center justify-between">
              {[
                { label: 'Day 1', active: true, current: false },
                { label: 'Day 7', active: true, current: false },
                { label: 'Today', active: true, current: true },
                { label: 'Day 21', active: false, current: false },
                { label: 'Day 30', active: false, current: false },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  {step.current ? (
                    <div className="relative flex h-9 w-9 scale-110 cursor-pointer items-center justify-center rounded-full border-[3px] border-pink-500 bg-white shadow-lg">
                      <div className="h-4 w-4 rounded-full border-2 border-pink-500 bg-white" />
                      <div className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-4 border-white shadow-sm transition-transform hover:scale-110 ${
                        step.active ? 'bg-pink-100' : 'bg-gray-100'
                      }`}
                    >
                      <div className={`h-3.5 w-3.5 rounded-full ${step.active ? 'bg-pink-500' : 'bg-gray-300'}`} />
                    </div>
                  )}
                  <span
                    className={`text-xs ${
                      step.current
                        ? 'font-bold text-pink-600'
                        : step.active
                          ? 'font-semibold text-gray-500'
                          : 'font-semibold text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Before / After + Daily check-in */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Slider */}
          <div className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-white/60 bg-gray-100 shadow-sm">
            <div className="absolute inset-0 h-full w-full">
              <div
                className="absolute inset-0 h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800')`,
                }}
              >
                <div className="absolute right-3 top-3 z-30 rounded-lg border border-white/40 bg-white/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                  RECENT
                </div>
              </div>
              <div
                className="absolute inset-0 h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100')`,
                  clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                }}
              >
                <div className="absolute left-3 top-3 z-30 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                  DAY 1
                </div>
              </div>
            </div>
            <div
              className="pointer-events-none absolute inset-0 flex h-full w-full items-center"
              style={{ left: `${sliderValue}%`, transform: 'translateX(-50%)', zIndex: 40 }}
            >
              <div className="h-full w-0.5 bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.4)] backdrop-blur-sm" />
              <div className="pointer-events-auto absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-pink-200 bg-white/90 text-pink-500 shadow-lg backdrop-blur-md transition-transform hover:scale-110">
                <div className="flex gap-0.5">
                  <div className="h-3 w-0.5 rounded-full bg-pink-400" />
                  <div className="h-3 w-0.5 rounded-full bg-pink-400" />
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="absolute inset-0 z-50 h-full w-full cursor-ew-resize opacity-0"
            />
          </div>

          {/* Daily check-in */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <h5 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <span className="rounded bg-pink-100 p-1 text-pink-500">
                  <Edit3 className="h-4 w-4" />
                </span>
                Daily Check-in
              </h5>
              <span className="text-[10px] text-gray-400">Auto-saved 2m ago</span>
            </div>
            <div className="mb-4 flex-1 rounded-xl border border-white/50 bg-white/40 p-1 shadow-inner transition-all focus-within:ring-2 focus-within:ring-pink-100">
              <textarea
                className="h-full min-h-[160px] w-full resize-none rounded-lg border-none bg-transparent p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                placeholder="How did your session go today? Record any observations..."
              />
            </div>
            <div className="flex gap-3">
              <button className="group flex w-1/3 items-center justify-center rounded-xl border border-dashed border-pink-300 bg-pink-50/50 px-4 py-2.5 transition-all hover:border-pink-400 hover:bg-pink-50">
                <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-pink-500 shadow-sm transition-transform group-hover:scale-110">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-gray-600">Add Photo</span>
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-bold tracking-wide text-white shadow-md shadow-pink-200/30 transition-all hover:shadow-lg">
                <CheckCircle className="h-5 w-5" /> Save Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
