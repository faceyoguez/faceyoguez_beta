import { isToday, isYesterday, format } from 'date-fns';

/** "Today" / "Yesterday" / "August 24, 2026" — WhatsApp-style day label. */
export function formatDateDividerLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
}

/** True when `current` falls on a different calendar day than `previous`. */
export function isNewDay(previous: string | null | undefined, current: string): boolean {
    if (!previous) return true;
    const a = new Date(previous);
    const b = new Date(current);
    return a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth() || a.getDate() !== b.getDate();
}

export function DateDivider({ dateStr, dark = false }: { dateStr: string; dark?: boolean }) {
    return (
        <div className="flex items-center justify-center my-3 select-none">
            <span
                className={
                    dark
                        ? 'px-3 py-1 rounded-full bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest'
                        : 'px-3 py-1 rounded-full bg-foreground/5 text-foreground/40 text-[10px] font-bold uppercase tracking-widest'
                }
            >
                {formatDateDividerLabel(dateStr)}
            </span>
        </div>
    );
}
