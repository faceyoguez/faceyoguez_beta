'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Download, CheckCircle, Loader2, Eye, AlertCircle, ArrowLeftRight, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImageComparison } from './image-comparison-slider';
import { createPortal } from 'react-dom';

// ── Constants ─────────────────────────────────────────────────────────────────

export const PHOTO_MILESTONE_DAYS = [1, 7, 14, 21, 25, 30] as const;
export type PhotoMilestoneDay = typeof PHOTO_MILESTONE_DAYS[number];

export type PhotoAngleKey = 'front' | 'left' | 'right';

const PANELS: { key: PhotoAngleKey; label: string; sublabel: string }[] = [
  { key: 'front', label: 'Front View', sublabel: 'Face forward, neutral expression' },
  { key: 'left', label: 'Left Profile', sublabel: 'Turn left — side view' },
  { key: 'right', label: 'Right Profile', sublabel: 'Turn right — side view' },
];

const PLACEHOLDERS: Record<PhotoAngleKey, string> = {
  front: '/assets/before_img.png',
  left: '/assets/before_left_img.png',
  right: '/assets/right_img.png',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMilestoneDay(day: number): day is PhotoMilestoneDay {
  return (PHOTO_MILESTONE_DAYS as readonly number[]).includes(day);
}

function nextMilestone(day: number): number | null {
  return PHOTO_MILESTONE_DAYS.find(d => d > day) ?? null;
}


// ── Single upload panel (student) ─────────────────────────────────────────────

const compressImage = (file: File): Promise<{ base64: string; mime: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.7 quality to significantly reduce size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          base64: compressedBase64.split(',')[1],
          mime: 'image/jpeg'
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface UploadPanelProps {
  config: typeof PANELS[number];
  pendingBase64: string | null;
  pendingMime: string | null;
  savedUrl: string | null;
  onSelect: (key: PhotoAngleKey, base64: string, mime: string) => void;
  accentColor: string;
  isDay1?: boolean;
}

function UploadPanel({ config, pendingBase64, pendingMime, savedUrl, onSelect, accentColor, isDay1 }: UploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewSrc = pendingBase64 ? `data:${pendingMime};base64,${pendingBase64}` : savedUrl;
  const hasPhoto = !!previewSrc;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { base64, mime } = await compressImage(file);
        onSelect(config.key, base64, mime);
      } catch (err) {
        console.error('Compression failed:', err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col rounded-[1.75rem] overflow-hidden border bg-white/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] relative group transition-all duration-300',
        isDay1 ? 'border-[#FF8A75]/30' : 'border-white/60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
        <span
          className="text-[8px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {config.label}
        </span>
        {hasPhoto && pendingBase64 && (
          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
            ✓ Ready
          </span>
        )}
        {hasPhoto && !pendingBase64 && savedUrl && (
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Saved</span>
        )}
      </div>

      {/* Photo area */}
      <div
        className={cn(
          'relative flex-1 mx-3 mb-3 rounded-[1.25rem] overflow-hidden min-h-[120px] sm:min-h-[140px]',
          !hasPhoto && 'border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300'
        )}
        style={!hasPhoto ? { borderColor: `${accentColor}40` } : {}}
        onClick={!hasPhoto ? () => fileRef.current?.click() : undefined}
      >
        {hasPhoto ? (
          <>
            <img
              src={previewSrc!}
              alt={config.label}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[8px] font-black uppercase tracking-widest">
                {config.label}
              </span>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition-all duration-300 opacity-0 hover:opacity-100"
            >
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Replace</span>
            </button>
          </>
        ) : (
          <>
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: `${accentColor}18` }}>
              <Camera className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center px-4">
              Tap to upload
            </p>
            <p className="text-[8px] text-slate-300 font-medium text-center px-6">{config.sublabel}</p>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </motion.div>
  );
}

// ── Before/After comparison strip (per angle) ─────────────────────────────────

interface ComparisonPanelProps {
  config: typeof PANELS[number];
  beforeUrl: string | null;
  afterUrl: string | null;
  dayNumber: number;
  accentColor: string;
  readOnly?: boolean;
  onReplace?: (key: PhotoAngleKey, base64: string, mime: string) => void;
  onPhotoClick?: (url: string, title: string) => void;
}

function ComparisonPanel({ config, beforeUrl, afterUrl, dayNumber, accentColor, readOnly, onReplace, onPhotoClick }: ComparisonPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { base64, mime } = await compressImage(file);
        onReplace?.(config.key, base64, mime);
      } catch (err) {
        console.error('Compression failed:', err);
      }
    }
  };

  return (
    <div className="group flex flex-col rounded-[2.5rem] overflow-hidden border border-[#FF8A75]/10 bg-white/60 backdrop-blur-3xl shadow-xl shadow-[#FF8A75]/5 transition-all duration-500 hover:border-[#FF8A75]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#FF8A75]/5 bg-white/20">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full" style={{ background: accentColor }} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: accentColor }}>
            {config.label}
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-all duration-300"
          >
            <Camera className="w-3 h-3" />
            Update Photo
          </button>
        )}
      </div>

      <div className="relative aspect-[4/5] sm:aspect-[21/9] min-h-[220px] sm:min-h-[260px] bg-slate-100">
        {afterUrl ? (
          dayNumber >= 7 ? (
            <div className="relative w-full h-full">
              <ImageComparison
                beforeImage={beforeUrl || PLACEHOLDERS[config.key]}
                afterImage={afterUrl}
                beforeLabel="Day 1"
                afterLabel={`Day ${dayNumber}`}
                disabled={!beforeUrl}
              />
              {readOnly && (
                <div className="absolute inset-x-0 top-6 z-40 flex justify-between px-6 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => onPhotoClick?.(beforeUrl || PLACEHOLDERS[config.key], `Before: Day 1 - ${config.label}`)}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider hover:bg-slate-900 hover:scale-105 transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Day 1
                  </button>
                  <button
                    type="button"
                    onClick={() => onPhotoClick?.(afterUrl, `After: Day ${dayNumber} - ${config.label}`)}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider hover:bg-slate-900 hover:scale-105 transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Day {dayNumber}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full group/photo">
              <img
                src={afterUrl}
                alt={config.label}
                className={cn("w-full h-full object-contain", readOnly && "cursor-pointer")}
                onClick={readOnly ? () => onPhotoClick?.(afterUrl, `Day ${dayNumber} - ${config.label}`) : undefined}
              />
              {readOnly && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/photo:bg-black/20 transition-all pointer-events-none">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50/50">
            <div className="h-14 w-14 rounded-[2rem] bg-white border border-[#FF8A75]/10 flex items-center justify-center shadow-sm">
              <Camera className="w-6 h-6 text-[#FF8A75]/20" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/60">Waiting for Capture</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">Upload your {config.label.toLowerCase()} to see progress</p>
            </div>
          </div>
        )}
      </div>

      {!readOnly && <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />}
    </div>
  );
}

// ── Main Student Component ────────────────────────────────────────────────────

export interface MultiAnglePhotos {
  front?: string | null;
  left?: string | null;
  right?: string | null;
}

interface AnglePhotoTrackerProps {
  dayNumber: number;
  currentDay?: number;
  /** Photos saved to DB for the current day */
  savedPhotos?: MultiAnglePhotos;
  /** Day 1 photos — used as "before" baseline from Day 7 onward */
  day1Photos?: MultiAnglePhotos;
  onSave: (photos: { front?: { base64: string; mimeType: string }; left?: { base64: string; mimeType: string }; right?: { base64: string; mimeType: string } }) => Promise<void>;
  isSaving?: boolean;
  accentColor?: string;
  allLogs?: any[];
}

export interface AnglePhotoViewerProps {
  dayNumber: number;
  photos: MultiAnglePhotos;
  day1Photos?: MultiAnglePhotos;
  studentName?: string;
  accentColor?: string;
  allLogs?: any[];
}

interface JourneyLog {
  day_number: number;
  photo_url?: string;
  photo_url_left?: string;
  photo_url_right?: string;
  created_at?: string;
  notes?: string;
  [key: string]: any;
}

export function AnglePhotoTracker({
  dayNumber,
  currentDay: propCurrentDay,
  savedPhotos,
  day1Photos,
  onSave,
  isSaving = false,
  accentColor = '#FF8A75',
  allLogs = [],
}: AnglePhotoTrackerProps) {
  const currentDay = propCurrentDay ?? dayNumber;
  const [pending, setPending] = useState<Partial<Record<PhotoAngleKey, { base64: string; mime: string }>>>({});
  const [activeAngle, setActiveAngle] = useState<PhotoAngleKey>('front');
  const hasPending = Object.keys(pending).length > 0;

  // Find the current active upload milestone based on currentDay
  let activeUploadMilestone: number = PHOTO_MILESTONE_DAYS[0];
  let nextMilestoneDay: number = PHOTO_MILESTONE_DAYS[1];
  for (let i = 0; i < PHOTO_MILESTONE_DAYS.length; i++) {
    if (currentDay >= PHOTO_MILESTONE_DAYS[i]) {
      activeUploadMilestone = PHOTO_MILESTONE_DAYS[i];
      nextMilestoneDay = PHOTO_MILESTONE_DAYS[i + 1] || (PHOTO_MILESTONE_DAYS[i] + 7);
    }
  }

  const isDay1 = dayNumber === 1;
  const isMilestone = isMilestoneDay(dayNumber);
  const isComparisonMode = dayNumber >= 7;
  const hasSavedDay1 = !!(day1Photos?.front || day1Photos?.left || day1Photos?.right);
  
  const isEditable = dayNumber === activeUploadMilestone;
  const isPast = dayNumber < activeUploadMilestone;
  const isFuture = dayNumber > activeUploadMilestone;
  const hasPhotos = !!(savedPhotos?.front || savedPhotos?.left || savedPhotos?.right);
  const next = nextMilestone(dayNumber);
  const isDay1LateUpload = isDay1 && !hasPhotos && isPast;
  // True when Day 1 baseline was never uploaded and we're past Day 1
  const isBaselineMissing = !isDay1 && !hasSavedDay1 && currentDay > 1;

  const handleSelect = (key: PhotoAngleKey, base64: string, mime: string) => {
    setPending(prev => ({ ...prev, [key]: { base64, mime } }));
  };

  const handleSave = async () => {
    const photos: any = {};
    if (pending.front) photos.front = { base64: pending.front.base64, mimeType: pending.front.mime };
    if (pending.left) photos.left = { base64: pending.left.base64, mimeType: pending.left.mime };
    if (pending.right) photos.right = { base64: pending.right.base64, mimeType: pending.right.mime };
    await onSave(photos);
    setPending({});
  };

  const daysLeft = nextMilestoneDay - currentDay;
  const isLate = daysLeft <= 2;

  // Banners for active milestone
  const successBanner = (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
        ✓ Day {dayNumber} photos saved successfully — Next milestone: Day {nextMilestoneDay}
      </p>
    </div>
  );

  const warningBanner = (
    <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/50">
      <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-rose-100">
        <AlertCircle className="w-5 h-5 text-rose-500" />
      </div>
      <div>
        <p className="text-sm font-black text-rose-700 leading-tight">
          🚨 Late Upload Warning: Day {dayNumber}
        </p>
        <p className="text-[11px] text-rose-500 font-medium mt-1 leading-relaxed">
          Upload your progress photos today! This will lock in {daysLeft === 1 ? '1 day' : `${daysLeft} days`} (when Day {nextMilestoneDay} starts).
        </p>
      </div>
    </div>
  );

  const pendingBanner = (
    <div className="flex items-start gap-4 p-5 rounded-2xl border border-blue-100 bg-blue-50/30">
      <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-blue-50">
        <Camera className="w-5 h-5 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-black text-blue-700 leading-tight">
          📸 Pending Photo Upload: Day {dayNumber}
        </p>
        <p className="text-[11px] text-blue-500 font-medium mt-1 leading-relaxed">
          Please upload your front, left, and right profile photos for Day {dayNumber} before Day {nextMilestoneDay} begins.
        </p>
      </div>
    </div>
  );

  // ── Past Locked Milestones ────────────────────────────────────────────────
  if (isPast && !isDay1LateUpload) {
    if (!hasPhotos) {
      // Skipped because Day 1 baseline was never uploaded — show contextual message
      if (isBaselineMissing) {
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-[3rem] border-2 border-dashed border-amber-100 text-center bg-amber-50/30">
            <div className="h-16 w-16 rounded-[2rem] bg-white border border-amber-100 flex items-center justify-center shadow-sm">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                ⏭️ Skipped: Day {dayNumber}
              </p>
              <p className="text-[9px] text-amber-400 font-medium leading-relaxed max-w-[260px]">
                This milestone was skipped because your Day 1 baseline photos were not uploaded in time.<br /><br />
                Upload your <strong>Day 1 baseline</strong> first — your progress tracking will continue from the next available milestone.
              </p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-[3rem] border-2 border-dashed border-slate-200 text-center bg-slate-50/50">
          <div className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-6 h-6 text-slate-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              ⚠️ Missed Milestone: Day {dayNumber}
            </p>
            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
              You did not upload photos for this milestone before the deadline.<br />This upload window is now locked.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AnglePhotoViewer
          dayNumber={dayNumber}
          photos={{
            front: savedPhotos?.front ?? null,
            left: savedPhotos?.left ?? null,
            right: savedPhotos?.right ?? null,
          }}
          day1Photos={day1Photos}
          accentColor={accentColor}
          allLogs={allLogs}
        />
      </div>
    );
  }

  // ── Future Locked Milestones ──────────────────────────────────────────────
  if (isFuture) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-[3rem] border-2 border-dashed border-[#FF8A75]/10 text-center bg-white/40 backdrop-blur-xl">
          <div className="h-16 w-16 rounded-[2rem] bg-white border border-[#FF8A75]/5 flex items-center justify-center shadow-sm">
            <Camera className="w-6 h-6 text-[#FF8A75]/20" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/60">
              Uploads unlock on milestones
            </p>
            <p className="text-[9px] text-slate-400 font-medium">
              Next milestone: Day {dayNumber} (Unlocks in {dayNumber - currentDay} days)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Non-milestone days: Show Gallery ─────────────────────────────────────
  if (!isMilestone) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 rounded-[2.5rem] border-2 border-dashed border-[#FF8A75]/10 text-center bg-white/40 backdrop-blur-xl">
          <div className="h-12 w-12 rounded-2xl bg-[#FF8A75]/5 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#FF8A75]/40" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/60">
              Uploads unlock on milestones
            </p>
            <p className="text-[9px] text-slate-400 font-medium">
              Next milestone: Day {next || '??'}
            </p>
          </div>
        </div>

        <AnglePhotoViewer
          dayNumber={dayNumber}
          photos={{
            front: savedPhotos?.front ?? null,
            left: savedPhotos?.left ?? null,
            right: savedPhotos?.right ?? null,
          }}
          day1Photos={day1Photos}
          accentColor={accentColor}
          allLogs={allLogs}
        />
      </div>
    );
  }

  // ── Day 1: Full prompt mode (Active & Editable, or Late baseline upload) ───────────────────────────
  if (isDay1 && (isEditable || isDay1LateUpload)) {
    return (
      <div className="space-y-5">
        {/* Banner */}
        {hasPhotos ? (
          successBanner
        ) : isDay1LateUpload ? (
          <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/50">
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-700 leading-tight">
                ⚠️ Late Baseline Photo Upload: Day 1
              </p>
              <p className="text-[11px] text-amber-500 font-medium mt-1 leading-relaxed">
                You missed the initial Day 1 upload window. Please upload your front, left, and right baseline photos now so we can enable progress tracking for your journey.
              </p>
            </div>
          </div>
        ) : isLate ? (
          warningBanner
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 p-5 rounded-2xl border-2"
            style={{ borderColor: `${accentColor}40`, background: `${accentColor}08` }}
          >
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}20` }}>
              <Camera className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700 leading-tight">
                📸 Welcome — Time to capture your <span style={{ color: accentColor }}>Day 1 baseline!</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                Upload your front, left, and right profile photos today. These become your <strong>"Before"</strong> photos — visible on all future milestone comparisons.
              </p>
            </div>
          </motion.div>
        )}

        {/* Angle Navbar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 w-fit mx-auto">
          {PANELS.map(panel => (
            <button
              key={panel.key}
              onClick={() => setActiveAngle(panel.key)}
              className={cn(
                "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                activeAngle === panel.key
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
              )}
            >
              {panel.key}
            </button>
          ))}
        </div>

        {/* Active Panel */}
        <div className="flex flex-col gap-6">
          {PANELS.filter(p => p.key === activeAngle).map(panel => (
            <UploadPanel
              key={panel.key}
              config={panel}
              pendingBase64={pending[panel.key]?.base64 ?? null}
              pendingMime={pending[panel.key]?.mime ?? null}
              savedUrl={savedPhotos?.[panel.key] ?? null}
              onSelect={handleSelect}
              accentColor={accentColor}
              isDay1
            />
          ))}
        </div>

        {/* Save bar */}
        <AnimatePresence>
          {hasPending && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl border"
              style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                {Object.keys(pending).length} photo{Object.keys(pending).length > 1 ? 's' : ''} ready to save
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-60 transition-all hover:scale-[1.02]"
                style={{ background: accentColor }}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving…' : 'Save Baseline Photos'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already saved confirmation */}
        {hasSavedDay1 && !hasPending && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Day 1 baseline photos saved ✓ — Next milestone: Day 7
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Milestone Day 7/14/21/25/30: Comparison mode (Active & Editable) ─────
  // If Day 1 baseline is missing AND this is a past milestone, block it.
  // But if it's the current active (editable) milestone, still allow upload.
  if (isBaselineMissing && !isEditable) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-[3rem] border-2 border-dashed border-amber-100 text-center bg-amber-50/30">
        <div className="h-16 w-16 rounded-[2rem] bg-white border border-amber-100 flex items-center justify-center shadow-sm">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
            📸 Day 1 Baseline Required
          </p>
          <p className="text-[9px] text-amber-400 font-medium leading-relaxed max-w-[280px]">
            Your Day 1 baseline photos haven't been uploaded yet. Please go to the <strong>Day 1</strong> tab and upload your baseline photos first — this enables the before/after comparison for Day {dayNumber} and all future milestones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      {hasPhotos ? successBanner : isLate ? warningBanner : pendingBanner}

      {/* Angle Navbar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 w-fit mx-auto">
        {PANELS.map(panel => (
          <button
            key={panel.key}
            onClick={() => setActiveAngle(panel.key)}
            className={cn(
              "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
              activeAngle === panel.key
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
            )}
          >
            {panel.key}
          </button>
        ))}
      </div>

      {/* 3 comparison panels in rows */}
      <div className="flex flex-col gap-6">
        {PANELS.filter(p => p.key === activeAngle).map(panel => {
          const pendingEntry = pending[panel.key];
          const afterUrl = pendingEntry
            ? `data:${pendingEntry.mime};base64,${pendingEntry.base64}`
            : (savedPhotos?.[panel.key] ?? null);

          return (
            <ComparisonPanel
              key={panel.key}
              config={panel}
              beforeUrl={day1Photos?.[panel.key] ?? null}
              afterUrl={afterUrl}
              dayNumber={dayNumber}
              accentColor={accentColor}
              readOnly={false}
              onReplace={handleSelect}
            />
          );
        })}
      </div>

      {/* Save bar */}
      <AnimatePresence>
        {hasPending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl border"
            style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
              {Object.keys(pending).length} photo{Object.keys(pending).length > 1 ? 's' : ''} ready to save
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-60 hover:scale-[1.02] transition-all"
              style={{ background: accentColor }}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving…' : 'Save Progress'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Read-only instructor/staff viewer ─────────────────────────────────────────

export function AnglePhotoViewer({ dayNumber, photos, day1Photos, studentName, accentColor = '#FF8A75', allLogs = [] }: AnglePhotoViewerProps) {
  const [selectedDay, setSelectedDay] = useState(dayNumber);
  const [activeAngle, setActiveAngle] = useState<PhotoAngleKey>('front');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Update selected day if prop changes (e.g. parent controls state)
  useEffect(() => {
    setSelectedDay(dayNumber);
  }, [dayNumber]);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPhotos = selectedDay === dayNumber ? photos : (allLogs.find((l: JourneyLog) => l.day_number === selectedDay) || {});

  const anyPhoto = currentPhotos.photo_url || currentPhotos.photo_url_left || currentPhotos.photo_url_right || currentPhotos.front || currentPhotos.left || currentPhotos.right;
  const showComparison = selectedDay >= 7;

  // Map fields consistently
  const mappedPhotos = {
    front: currentPhotos.photo_url || currentPhotos.front || null,
    left: currentPhotos.photo_url_left || currentPhotos.left || null,
    right: currentPhotos.photo_url_right || currentPhotos.right || null,
  };

  const milestones = PHOTO_MILESTONE_DAYS.filter(d => allLogs.some((l: JourneyLog) => l.day_number === d) || d === dayNumber);

  return (
    <div className="space-y-8">
      {/* Milestone Slider / Navigator */}
      {milestones.length > 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Milestone Journey</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Day {selectedDay}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/40 backdrop-blur-xl rounded-2xl border border-[#FF8A75]/10">
            {PHOTO_MILESTONE_DAYS.filter(d => d !== 1 && d !== 25).map(d => {
              const hasData = allLogs.some((l: JourneyLog) => l.day_number === d) || d === dayNumber;
              const isActive = selectedDay === d;

              return (
                <button
                  key={d}
                  onClick={() => hasData && setSelectedDay(d)}
                  disabled={!hasData}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black transition-all duration-300 relative overflow-hidden",
                    isActive ? "bg-slate-900 text-white shadow-lg scale-[1.02]" : hasData ? "bg-white/60 text-slate-600 hover:bg-white" : "bg-slate-50 text-slate-200 cursor-not-allowed opacity-50"
                  )}
                >
                  {isActive && (
                    <motion.div layoutId="active-pill" className="absolute inset-0 bg-slate-900 -z-10" />
                  )}
                  D{d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Angle Navbar */}
      <div className="flex items-center gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 w-fit mx-auto shadow-sm">
        {PANELS.map(panel => (
          <button
            key={panel.key}
            onClick={() => setActiveAngle(panel.key)}
            className={cn(
              "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
              activeAngle === panel.key
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-white"
            )}
          >
            {panel.key}
          </button>
        ))}
      </div>

      {!anyPhoto ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-[3rem] border-2 border-dashed border-[#FF8A75]/10 text-center bg-white/40 backdrop-blur-xl">
          <div className="h-16 w-16 rounded-[2rem] bg-white border border-[#FF8A75]/5 flex items-center justify-center shadow-sm">
            <Eye className="w-6 h-6 text-[#FF8A75]/20" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/60">
              No photos for Day {selectedDay}
            </p>
            {studentName && (
              <p className="text-[9px] text-slate-400 font-medium">{studentName} hasn't uploaded photos for this milestone yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {PANELS.filter(p => p.key === activeAngle).map(panel => (
            <ComparisonPanel
              key={panel.key}
              config={panel}
              beforeUrl={day1Photos?.[panel.key] || (allLogs.find((l: JourneyLog) => l.day_number === 1)?.[panel.key === 'front' ? 'photo_url' : `photo_url_${panel.key}`]) || null}
              afterUrl={mappedPhotos[panel.key]}
              dayNumber={selectedDay}
              accentColor={accentColor}
              readOnly={true}
              onPhotoClick={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {lightboxUrl && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0" onClick={() => setLightboxUrl(null)} />
              
              <div className="relative w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl p-6 flex flex-col z-10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="text-left">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Visual Progress Tracker</span>
                    <h4 className="text-sm font-bold text-slate-800 capitalize mt-0.5">{lightboxTitle}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Download button */}
                    <button
                      onClick={async () => {
                        if (!lightboxUrl) return;
                        try {
                          const response = await fetch(lightboxUrl);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          const ext = blob.type.includes('jpeg') || blob.type.includes('jpg') ? 'jpg' : blob.type.includes('png') ? 'png' : 'jpg';
                          a.download = `${lightboxTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          // Fallback: open in new tab
                          window.open(lightboxUrl, '_blank');
                        }
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-[#FF8A75]/10 text-slate-400 hover:text-[#FF8A75] flex items-center justify-center transition-all cursor-pointer"
                      title="Download Photo"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {/* Close button */}
                    <button
                      onClick={() => setLightboxUrl(null)}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                      title="Close Full View"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative w-full aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100/80">
                  <img
                    src={lightboxUrl}
                    alt="Progress View"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

