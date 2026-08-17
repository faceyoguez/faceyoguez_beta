'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Loader2, ImageOff } from 'lucide-react';
import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { toast } from 'sonner';

interface StudentPhotosModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

const ANGLES: { key: 'photo_url' | 'photo_url_left' | 'photo_url_right'; label: string }[] = [
  { key: 'photo_url', label: 'Front' },
  { key: 'photo_url_left', label: 'Left' },
  { key: 'photo_url_right', label: 'Right' },
];

/**
 * Shows a student's actual in-app progress photos (uploaded during their
 * face-yoga journey, stored in `journey_logs`) — not a Google Photos search,
 * which searched the *staff member's own* photo library and never worked.
 */
export function StudentPhotosModal({ open, onClose, studentId, studentName }: StudentPhotosModalProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<JourneyLog[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getJourneyLogs(studentId);
        if (!cancelled) setLogs(data.filter((l) => l.photo_url || l.photo_url_left || l.photo_url_right));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Failed to load photos: ' + message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open, studentId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[1.5rem] border border-[#FF8A75]/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold font-aktiv text-slate-900 truncate">Progress Photos</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 truncate">{studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {loading ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF8A75]" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Loading photos...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <ImageOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No photos uploaded yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[260px]">{studentName} hasn&apos;t uploaded any progress photos in their journey log.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {logs.map((log) => (
                <div key={log.id}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Day {log.day_number}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {ANGLES.map(({ key, label }) => {
                      const url = log[key];
                      return (
                        <a
                          key={key}
                          href={url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={tileClass(!url)}
                        >
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={`${studentName} — Day ${log.day_number} ${label}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 uppercase">No {label}</span>
                          )}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[8px] font-bold uppercase tracking-wide">{label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function tileClass(empty: boolean) {
  return `relative aspect-square rounded-xl overflow-hidden border ${empty ? 'border-dashed border-slate-200 bg-slate-50 flex items-center justify-center' : 'border-slate-100 bg-slate-100'}`;
}
