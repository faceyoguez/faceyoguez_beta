'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Star, Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { saveDailyCheckIn, checkAndCreateJourneyNotifications, type JourneyLog } from '@/lib/actions/journey';
import type { Profile } from '@/types/database';

interface DashboardJourneyProps {
  currentUser: Profile;
  activeBatch: any;
  initialJourneyLogs: JourneyLog[];
  subscriptionStartDate: string | null;
}

export function DashboardJourney({
  currentUser,
  activeBatch,
  initialJourneyLogs,
  subscriptionStartDate,
}: DashboardJourneyProps) {
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>(initialJourneyLogs);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate current day based on batch start date or subscription start
  const effectiveAnchorDate = React.useMemo(() => {
    if (activeBatch?.start_date && subscriptionStartDate) {
      const batchStart = new Date(activeBatch.start_date);
      const subStart = new Date(subscriptionStartDate);
      return subStart > batchStart ? subscriptionStartDate : activeBatch.start_date;
    }
    return activeBatch?.start_date || subscriptionStartDate || null;
  }, [activeBatch?.start_date, subscriptionStartDate]);

  const currentDay = React.useMemo(() => {
    const anchorDateStr = effectiveAnchorDate;
    if (!anchorDateStr) return 1;

    const startDate = new Date(anchorDateStr);
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(JOURNEY_MAX_DAY, Math.max(1, diffDays));
  }, [effectiveAnchorDate]);

  // Initialize active step to today's day
  useEffect(() => {
    setActiveStepDay(currentDay);
  }, [currentDay]);

  useEffect(() => {
    if (currentUser?.id && currentDay) {
      checkAndCreateJourneyNotifications(currentUser.id, currentDay);
    }
  }, [currentUser?.id, currentDay]);

  const activeLog = journeyLogs.find((l) => l.day_number === activeStepDay);
  const day1Log = journeyLogs.find((l) => l.day_number === 1);
  const day25Log = journeyLogs.find((l) => l.day_number === 25);

  const isDay1 = activeStepDay === 1;
  const isDay25 = activeStepDay === 25;
  const hasPhoto = !!activeLog?.photo_url;

  const isEditable = React.useMemo(() => {
    if (isDay1) return currentDay < 7;
    if (isDay25) return currentDay >= 25 && currentDay < 30;
    return false;
  }, [isDay1, isDay25, currentDay]);

  const isPast = React.useMemo(() => {
    if (isDay1) return currentDay >= 7;
    if (isDay25) return currentDay >= 30;
    return false;
  }, [isDay1, isDay25, currentDay]);

  const isFuture = React.useMemo(() => {
    if (isDay25) return currentDay < 25;
    return false;
  }, [isDay25, currentDay]);

  const daysLeft = React.useMemo(() => {
    if (isDay1) return 7 - currentDay;
    if (isDay25) return 30 - currentDay;
    return 0;
  }, [isDay1, isDay25, currentDay]);

  const isLate = daysLeft <= 2;

  const beforeImage =
    day1Log?.photo_url ||
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  const afterImage = day25Log?.photo_url || selectedImageBase64 || null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setSelectedImageBase64(base64Str.split(',')[1]);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async () => {
    setIsSavingLog(true);
    const { success, error, data } = await saveDailyCheckIn(
      currentUser.id,
      activeStepDay,
      null,
      selectedImageBase64,
      selectedImageMime || 'image/jpeg'
    );
    if (success && data) {
      setJourneyLogs((prev) => [...prev.filter((l) => l.day_number !== activeStepDay), data]);
      setSelectedImageBase64(null);
    } else {
      alert(error || 'Failed to save log.');
    }
    setIsSavingLog(false);
  };

  return (
    <section className="liquid-glass rounded-[2rem] p-6 md:p-8 shadow-sm lustre-border overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-aktiv font-bold text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Transformation Journey
        </h2>
        <span className="text-sm font-aktiv font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full shadow-sm">
          Day {currentDay}
        </span>
      </div>

      <div className="flex flex-col gap-10">
        <div className="rounded-[1.5rem] bg-surface-container-lowest/80 p-8 shadow-sm ring-1 ring-outline-variant/15 backdrop-blur-md">
          <JourneyProgress
            currentDay={currentDay}
            activeDay={activeStepDay}
            onSelectDay={setActiveStepDay}
            completedDays={new Set(journeyLogs.map((l) => l.day_number))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="rounded-[2rem] overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_8px_32px_rgba(0,0,0,0.08)] bg-surface-container-low aspect-[4/3] relative group">
            {activeStepDay === 25 && afterImage ? (
              <ImageComparison
                beforeImage={beforeImage}
                afterImage={afterImage as string}
                altBefore="Day 1"
                altAfter={`Day 25`}
              />
            ) : (
              <Image
                src={
                  activeLog?.photo_url ||
                  (activeStepDay === 25 ? (afterImage as string ?? beforeImage) : beforeImage)
                }
                alt={`Day ${activeStepDay}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-all duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-aktiv font-bold uppercase tracking-widest rounded-full ring-1 ring-white/20 shadow-lg">
                Day {activeStepDay} View
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center text-center px-4 w-full">
            <div className="space-y-2">
              <h4 className="text-lg font-aktiv font-bold text-foreground">
                {activeStepDay === 1 ? 'Start Your Journey' : activeStepDay === 25 ? 'Final Comparison' : `Day ${activeStepDay} Progress`}
              </h4>
              <p className="text-sm text-foreground/50 font-jakarta font-medium max-w-[280px]">
                {activeStepDay === 1 || activeStepDay === 25
                  ? 'Capture your face yoga progress to see the visible results of your practice.'
                  : 'Maintain your consistent practice. Photo uploads are only required for Day 1 and Day 25.'}
              </p>
            </div>

            {/* Banners for upload status */}
            {(isDay1 || isDay25) && (
              <div className="w-full max-w-[280px] space-y-3">
                {isEditable && (
                  <>
                    {hasPhoto ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/50 text-[10px] font-black uppercase text-emerald-600 tracking-wider justify-center">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        ✓ Photo Saved Successfully
                      </div>
                    ) : isLate ? (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-left">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-rose-700 tracking-wider">🚨 Late Upload Warning</p>
                          <p className="text-[9px] text-rose-500 font-semibold mt-0.5">
                            Please upload today! Day {activeStepDay} locks in {daysLeft} days.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-200/50 text-left">
                        <Camera className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">📸 Pending Photo Upload</p>
                          <p className="text-[9px] text-blue-500 font-semibold mt-0.5">
                            Upload Day {activeStepDay} photos before Day {activeStepDay === 1 ? '7' : '30'} starts.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isPast && !hasPhoto && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                    <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">⚠️ Missed Milestone</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        Day {activeStepDay} photos were not uploaded before the deadline. Locked.
                      </p>
                    </div>
                  </div>
                )}

                {isPast && hasPhoto && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/50 text-[10px] font-black uppercase text-emerald-600 tracking-wider justify-center">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    ✓ Day {activeStepDay} Milestone Saved
                  </div>
                )}

                {isFuture && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left">
                    <Camera className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">🔒 Future Milestone</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        Day {activeStepDay} photos will unlock on Day 25.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isEditable && (
              <div className="flex flex-col gap-4 w-full max-w-[240px] mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-full gap-2 rounded-[1.25rem] bg-surface-container-highest/50 px-6 py-4 text-sm font-aktiv font-bold text-foreground shadow-sm ring-1 ring-outline-variant/20 transition-all hover:scale-[1.03] hover:bg-surface-container-highest hover:shadow-md active:scale-95"
                >
                  <Camera className="h-5 w-5 text-primary" />
                  Select Photo
                </button>
                {selectedImageBase64 && (
                  <button
                    onClick={handleSaveLog}
                    disabled={isSavingLog}
                    className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-primary py-4 text-sm font-aktiv font-bold text-primary-on shadow-[0_8px_24px_rgba(232,152,142,0.3)] transition-all hover:scale-[1.03] hover:bg-primary/90 disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
                  >
                    {isSavingLog ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    Save Day {activeStepDay} Progress
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
