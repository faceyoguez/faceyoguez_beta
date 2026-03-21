import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PlansClient } from './PlansClient';

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

    // Get current subscription to see if they are already on a plan
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

    return (
        <PlansClient
            currentSubscription={subscription}
            userId={user.id}
            currentUser={profile}
        />
    );
}
