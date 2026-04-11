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

  const today = new Date().toISOString().split('T')[0];

  // Get active subscription
  // Prioritize paid over trial, and pick the earliest start date for the journey count
  const { data: activeSubs } = await admin
    .from('subscriptions')
    .select('*, is_trial')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .eq('plan_type', 'one_on_one')
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('is_trial', { ascending: true }) // Paid (false) comes before trial (true)
    .order('start_date', { ascending: true }); // Earliest first

  const subscription = activeSubs && activeSubs.length > 0 ? activeSubs[0] : null;

  return (
    <StudentOneOnOneClient
      currentUser={profile}
      hasSubscription={!!subscription}
      subscriptionStartDate={subscription?.start_date ?? null}
      durationMonths={subscription?.duration_months ?? 1}
      isTrial={subscription?.is_trial ?? false}
    />
  );
}
