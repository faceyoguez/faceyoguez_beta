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

    // Get ALL active subscriptions (student can have multiple)
    const { data: subscriptions } = await admin
        .from('subscriptions')
        .select('*')
        .eq('student_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

    return <PlansClient activeSubscriptions={subscriptions || []} userId={user.id} />;
}
