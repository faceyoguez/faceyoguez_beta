const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Shared date-window math for "load a week at a time" chat pagination.
 *
 * `cursor` is the earliest `created_at` timestamp currently loaded on the
 * client (or null/undefined on first load). Each call computes the next
 * older 7-day window to fetch — first load gets the last 7 days, each
 * subsequent "load more" reaches back one more week.
 */
export function getWeekWindow(cursor?: string | null): { windowStart: string; windowEnd: string | null } {
  const end = cursor ? new Date(cursor) : null;
  const start = new Date((end ? end.getTime() : Date.now()) - WEEK_MS);
  return {
    windowStart: start.toISOString(),
    windowEnd: end ? end.toISOString() : null,
  };
}
