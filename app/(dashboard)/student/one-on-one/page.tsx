import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { StudentOneOnOneClient } from './StudentOneOnOneClient';

export default async function StudentOneOnOnePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

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
    />
  );
}
