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

    // Get current user profile for Razorpay prefill
    const { data: profile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Get all subscriptions to see if they ever used a trial
    const { data: allSubscriptions } = await supabase
        .from('subscriptions')
        .select('plan_type, status, is_trial')
        .eq('student_id', user.id);

    const activeSubscription = allSubscriptions?.filter(s => ['active', 'pending'].includes(s.status)) || [];
    const hasUsedTrial = allSubscriptions?.some(s => s.is_trial) || false;

    return (
        <PlansClient
            currentSubscription={activeSubscription}
            userId={user.id}
            currentUser={profile}
            hasUsedTrial={hasUsedTrial}
        />
    );
}
