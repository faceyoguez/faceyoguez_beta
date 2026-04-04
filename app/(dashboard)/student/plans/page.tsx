import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlansClient from './PlansClient';

export default async function PlansPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

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

    const hasUsedTrial = allSubscriptions?.some(s => s.is_trial) || false;

    // Active paid subscription = is_active, not a trial, and end_date is today or future
    const hasActiveSubscription = allSubscriptions?.some(
        s => s.status === 'active' && !s.is_trial && s.end_date && s.end_date >= today
    ) || false;

    const activeSubscription = allSubscriptions?.filter(s => ['active', 'pending'].includes(s.status)) || [];

    return (
        <PlansClient
            currentSubscription={activeSubscription}
            userId={user.id}
            currentUser={profile}
            hasUsedTrial={hasUsedTrial}
            hasActiveSubscription={hasActiveSubscription}
        />
    );
}
