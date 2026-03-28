import { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const map = new Map<string, RateLimitEntry>();

/**
 * A simple in-memory rate limiter.
 * Note: Since Next.js API routes run in a serverless environment (like Vercel),
 * this memory map will reset on cold starts and isn't shared across edge nodes.
 * However, it provides basic protection against rapid spamming from a single edge instance.
 */
export function rateLimit(request: NextRequest, limit: number, windowMs: number) {
  // Use IP if available, fallback to a generic string (which would limit globally — limit per IP is better)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const entry = map.get(ip);
  if (!entry) {
    map.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }

  if (now > entry.resetTime) {
    map.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  entry.count += 1;
  return { success: true };
}
