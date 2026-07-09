'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface RecordingPlayerModalProps {
    meetingId: string;
    topic: string;
    onClose: () => void;
}

/**
 * Plays a recorded session inside our own site via /api/recordings/[meetingId],
 * which streams the file server-side — students never get sent to zoom.us.
 */
export function RecordingPlayerModal({ meetingId, topic, onClose }: RecordingPlayerModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 shrink-0">
                <p className="text-[11px] font-bold text-white/70 truncate pr-4">{topic}</p>
                <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="relative flex-1 min-h-0 px-4 pb-4 lg:px-6 lg:pb-6">
                <video
                    controls
                    autoPlay
                    src={`/api/recordings/${meetingId}`}
                    className="w-full h-full rounded-2xl bg-black"
                />
            </div>
        </div>,
        document.body
    );
}
