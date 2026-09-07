'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Used by every plan/consultation CTA on the public marketing pages.
 *
 * If the visitor has no session at all, this quietly creates a temporary
 * "guest" account (Supabase anonymous sign-in) so they can browse the
 * normally-locked dashboard (plan picker, pricing, etc.) exactly like a
 * real signed-up-but-not-subscribed student — no email/password required
 * yet. If they already have a real or guest session, it just navigates.
 *
 * Registration only happens later, right before payment (see
 * GuestUpgradeModal), so nothing here creates a "real" account.
 *
 * Falls back to the old sign-up redirect if anonymous sign-in isn't
 * available (e.g. not yet enabled in the Supabase project), so this never
 * strands a visitor on a dead click.
 */
export async function startGuestBrowsing(redirectPath: string) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    }

    window.location.href = redirectPath;
  } catch (err) {
    console.error('[Guest Session] Anonymous sign-in unavailable, falling back to sign-up:', err);
    window.location.href = `/auth/signup?redirectTo=${encodeURIComponent(redirectPath)}`;
  }
}
