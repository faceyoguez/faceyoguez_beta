import { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const map = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of map.entries()) {
    if (now > entry.resetTime) {
      map.delete(key);
    }
  }
}

/**
 * Sliding-window rate limiter with automatic memory cleanup.
 *
 * Returns an object with:
 * - success: whether the request is allowed
 * - limit: the max requests allowed
 * - remaining: how many requests are left in the window
 * - resetMs: milliseconds until the window resets
 *
 * Note: In-memory on Vercel — each serverless instance has its own map.
 * This provides protection against rapid spamming from a single instance.
 * For production-grade limiting at scale, use Vercel KV or Upstash Redis.
 */
export function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; resetMs: number } {
  // Periodic cleanup to prevent unbounded memory growth
  cleanupStaleEntries();

  // Use IP if available, fallback to a generic string
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const now = Date.now();

  const entry = map.get(ip);
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    map.set(ip, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, resetMs: windowMs };
  }

  const remaining = Math.max(0, limit - entry.count - 1);
  const resetMs = entry.resetTime - now;

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, resetMs };
  }

  entry.count += 1;
  return { success: true, limit, remaining, resetMs };
}

/**
 * Convenience: rate limit by user ID instead of IP.
 * Use for authenticated endpoints where IP-based limiting is insufficient.
 */
export function rateLimitByUser(
  userId: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  cleanupStaleEntries();

  const key = `user:${userId}`;
  const now = Date.now();

  const entry = map.get(key);
  if (!entry || now > entry.resetTime) {
    map.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: Math.max(0, limit - entry.count) };
}
