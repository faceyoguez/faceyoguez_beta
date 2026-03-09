import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { StudentChatClient } from './StudentChatClient';

export default async function StudentChatPage() {
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

  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan_type')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  return (
    <StudentChatClient
      currentUser={profile}
      planType={sub?.plan_type || 'one_on_one'}
    />
  );
}
