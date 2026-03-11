import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PlansClient } from './PlansClient';

export default async function PlansPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Get current subscription to see if they are already on a plan
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return <PlansClient currentSubscription={subscription} userId={user.id} />;
}
