'use client';

/**
 * Bounce page for shared plan/checkout links (WhatsApp, Instagram, etc.).
 *
 * A raw `/student/plans?plan=...` link only works for a visitor who
 * already has a session — clicking a real button on the site creates one
 * first (see lib/guestSession.ts), but a link opened cold from a chat app
 * has none, so the server used to redirect straight to login. This page
 * is where `/student/plans` sends a session-less visitor instead: it
 * creates the same temporary guest session a button click would, then
 * forwards them into the exact plan/tier they were sent, in one hop.
 */

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { startGuestBrowsing } from '@/lib/guestSession';

function PlansGoContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    startGuestBrowsing(`/student/plans${qs ? `?${qs}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function PlansGoPage() {
  return (
    <div className="min-h-screen bg-[#FFFAF7] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF8A75] mx-auto" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading your plan…</p>
      </div>
      <Suspense fallback={null}>
        <PlansGoContent />
      </Suspense>
    </div>
  );
}
