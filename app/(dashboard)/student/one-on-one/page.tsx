import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { StudentOneOnOneClient } from './StudentOneOnOneClient';

export default async function StudentOneOnOnePage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const profile = await getServerProfile(user.id);
  if (!profile) redirect('/auth/login');

  const admin = createAdminClient();

  // Get active subscription
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .eq('plan_type', 'one_on_one')
    .single();

  return (
    <StudentOneOnOneClient
      currentUser={profile}
      hasSubscription={!!subscription}
      subscriptionStartDate={subscription?.start_date ?? null}
    />
  );
}
