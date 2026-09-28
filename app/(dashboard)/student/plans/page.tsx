import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import PlansClient from './PlansClient';

// NOTE: a session-less cold visit to this route (e.g. a shared WhatsApp/
// Instagram link) never actually reaches this "if (!user)" check — the
// shared (dashboard) layout's own guard redirects to /auth/login first,
// since layouts render before their child page. The real fix for that is
// in middleware.ts, which intercepts this specific path before the
// layout runs and routes it through the guest-session bouncer at
// /plans/go instead. This check stays only as a defensive fallback.
export default async function PlansPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Guests (Supabase anonymous sign-in) are a real `user` above, so they
    // pass through here — same locked-plans browsing experience as a real
    // signed-up-but-unsubscribed student. They only register for real right
    // before payment (see GuestUpgradeModal in PlansClient).
    const isGuest = !!(user as any).is_anonymous;

    const admin = createAdminClient();

    // Get current user profile
    const { data: profile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Get all subscriptions
    const { data: allSubscriptions } = await admin
        .from('subscriptions')
        .select('plan_type, status, is_trial, end_date')
        .eq('student_id', user.id);

    const today = new Date().toISOString().split('T')[0];

    const hasUsedTrial = (allSubscriptions as any[])?.some(s => s.is_trial) || false;

    // Active paid subscription = is_active, not a trial, and end_date is today or future (or null = lifetime)
    const hasActiveSubscription = (allSubscriptions as any[])?.some(
        (s: any) => s.status === 'active' && !s.is_trial && (!s.end_date || s.end_date >= today)
    ) || false;

    const activeSubscription = (allSubscriptions as any[])?.filter((s: any) => ['active', 'pending'].includes(s.status)) || [];

    return (
        <Suspense fallback={<div>Loading Plans...</div>}>
            <PlansClient
                currentSubscription={activeSubscription}
                userId={user.id}
                currentUser={profile}
                hasActiveSubscription={hasActiveSubscription}
                isGuest={isGuest}
            />
        </Suspense>
    );

}
