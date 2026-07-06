import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ─── IST Date/Time Formatting ────────────────────────────────────────────────
// Always renders times in Asia/Calcutta (IST, UTC+5:30) regardless of the
// viewer's browser timezone. This is critical for a India-based platform.
const IST_LOCALE = 'en-IN';
const IST_TZ = 'Asia/Calcutta';

export function formatIST(dateStr: string): string {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString(IST_LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: IST_TZ });
    const time = d.toLocaleTimeString(IST_LOCALE, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: IST_TZ });
    return `${date}, ${time} IST`;
}

export function formatISTDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(IST_LOCALE, {
        weekday: 'short', day: 'numeric', month: 'short',
        timeZone: IST_TZ
    });
}

export function formatISTTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString(IST_LOCALE, {
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: IST_TZ
    });
}

// ─── Session Status Helpers ──────────────────────────────────────────────────
// A session is "expired" if it was scheduled but never started (no LIVE/DONE)
// AND it's more than 3 hours past its scheduled start time.
export function getSessionStatus(startTime: string, durationMinutes: number, calendarEventId?: string | null): 'live' | 'completed' | 'expired' | 'upcoming' {
    if (calendarEventId === 'LIVE') return 'live';
    if (calendarEventId === 'DONE') return 'completed';
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = start + durationMinutes * 60_000;
    const expireThreshold = end + 3 * 60 * 60_000; // 3 hours after session end
    if (now > expireThreshold) return 'expired';
    if (now >= start && now <= end) return 'live'; // auto-live within window
    return 'upcoming';
}

// Convert a datetime-local input value (e.g. "2026-07-07T19:30") to a full
// ISO 8601 string with IST offset (+05:30) for passing to Zoom/DB.
export function localInputToIST(datetimeLocalValue: string): string {
    if (!datetimeLocalValue) return '';
    // datetime-local gives "YYYY-MM-DDTHH:mm" — append IST offset
    return `${datetimeLocalValue}:00+05:30`;
}
